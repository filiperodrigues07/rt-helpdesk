import { prisma } from '../utils/prisma';
import { tenantPrisma } from '../utils/tenantPrisma';
import { tenantContext } from '../utils/tenantContext';

// Espelha o limite de "at risk" usado no badge por chamado (frontend/src/components/tickets/SlaIndicator.tsx).
const SLA_RISK_WINDOW_MIN = 4 * 60;
const PERIOD_DAYS = 14;

interface DailyCountRow {
  day: Date;
  count: bigint;
}

interface DailyAvgRow {
  day: Date;
  avg_hours: number | null;
}

function buildDailySeries<T>(days: number, map: Map<string, T>, empty: T) {
  const series: { date: string; value: T }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    series.push({ date: key, value: map.get(key) ?? empty });
  }

  return series;
}

export const dashboardService = {
  async summary() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const slaRiskThreshold = new Date(now.getTime() + SLA_RISK_WINDOW_MIN * 60 * 1000);
    const periodStart = new Date(startOfDay);
    periodStart.setDate(periodStart.getDate() - (PERIOD_DAYS - 1));
    const tenantId = tenantContext.getTenantId();

    const [
      byStatus,
      byPriority,
      recentHistory,
      resolvedToday,
      slaAtRisk,
      openedRows,
      resolvedRows,
      avgResolutionRows,
      byAssigneeRaw,
    ] = await Promise.all([
      tenantPrisma.ticket.groupBy({ by: ['status'], _count: { _all: true } }),
      tenantPrisma.ticket.groupBy({ by: ['priority'], _count: { _all: true } }),
      // TicketHistory não tem tenantId próprio (escopado via Ticket) — filtro manual pela relação.
      tenantPrisma.ticketHistory.findMany({
        where: { ticket: { tenantId } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          ticket: { select: { id: true, number: true, title: true } },
        },
      }),
      tenantPrisma.ticket.count({
        where: { status: { in: ['RESOLVIDO', 'ENCERRADO'] }, resolvedAt: { gte: startOfDay } },
      }),
      tenantPrisma.ticket.count({
        where: { status: { notIn: ['RESOLVIDO', 'ENCERRADO'] }, slaDueAt: { lte: slaRiskThreshold } },
      }),
      // $queryRaw não passa pela extension de tenant scope — filtro manual.
      prisma.$queryRaw<DailyCountRow[]>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "tickets"
        WHERE "createdAt" >= ${periodStart} AND "tenantId" = ${tenantId}
        GROUP BY day
        ORDER BY day ASC
      `,
      prisma.$queryRaw<DailyCountRow[]>`
        SELECT date_trunc('day', "resolvedAt") AS day, COUNT(*)::bigint AS count
        FROM "tickets"
        WHERE "resolvedAt" IS NOT NULL AND "resolvedAt" >= ${periodStart} AND "tenantId" = ${tenantId}
        GROUP BY day
        ORDER BY day ASC
      `,
      prisma.$queryRaw<DailyAvgRow[]>`
        SELECT date_trunc('day', "resolvedAt") AS day,
               AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600.0) AS avg_hours
        FROM "tickets"
        WHERE "resolvedAt" IS NOT NULL AND "resolvedAt" >= ${periodStart} AND "tenantId" = ${tenantId}
        GROUP BY day
        ORDER BY day ASC
      `,
      tenantPrisma.ticket.groupBy({ by: ['assigneeId'], _count: { _all: true } }),
    ]);

    const statusCount = (status: string) =>
      byStatus.find((row) => row.status === status)?._count._all ?? 0;

    const openedMap = new Map(openedRows.map((row) => [row.day.toISOString().slice(0, 10), Number(row.count)]));
    const resolvedMap = new Map(
      resolvedRows.map((row) => [row.day.toISOString().slice(0, 10), Number(row.count)]),
    );
    const avgResolutionMap = new Map(
      avgResolutionRows.map((row) => [row.day.toISOString().slice(0, 10), Number(row.avg_hours ?? 0)]),
    );

    const openedSeries = buildDailySeries(PERIOD_DAYS, openedMap, 0);
    const resolvedSeries = buildDailySeries(PERIOD_DAYS, resolvedMap, 0);
    const avgResolutionSeries = buildDailySeries(PERIOD_DAYS, avgResolutionMap, 0);

    const byPeriod = openedSeries.map((entry, index) => ({
      date: entry.date,
      opened: entry.value,
      resolved: resolvedSeries[index].value,
    }));

    const resolutionTimeEvolution = avgResolutionSeries.map((entry) => ({
      date: entry.date,
      avgHours: Math.round(entry.value * 10) / 10,
    }));

    const assigneeIds = byAssigneeRaw.map((row) => row.assigneeId).filter((id): id is string => !!id);
    const assignees = assigneeIds.length
      ? await tenantPrisma.user.findMany({ where: { id: { in: assigneeIds } }, select: { id: true, name: true } })
      : [];
    const assigneeNameById = new Map(assignees.map((user) => [user.id, user.name]));

    const byAssignee = byAssigneeRaw
      .filter((row) => row.assigneeId)
      .map((row) => ({
        assigneeId: row.assigneeId as string,
        assigneeName: assigneeNameById.get(row.assigneeId as string) ?? 'Não atribuído',
        count: row._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      cards: {
        open: statusCount('NOVO'),
        inProgress: statusCount('EM_ANDAMENTO'),
        waitingCustomer: statusCount('AGUARDANDO_CLIENTE'),
        waitingThirdParty: statusCount('AGUARDANDO_TERCEIRO'),
        resolvedToday,
        slaAtRisk,
      },
      byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
      byPriority: byPriority.map((row) => ({ priority: row.priority, count: row._count._all })),
      byPeriod,
      byAssignee,
      resolutionTimeEvolution,
      recentActivity: recentHistory.map((entry) => ({
        id: entry.id,
        action: entry.action,
        fieldName: entry.fieldName,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        createdAt: entry.createdAt,
        author: entry.author,
        ticket: entry.ticket,
      })),
    };
  },
};
