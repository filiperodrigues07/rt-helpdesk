import { Prisma, TicketPriority, TicketStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { tenantPrisma } from '../utils/tenantPrisma';
import { tenantContext } from '../utils/tenantContext';

export interface ReportFilters {
  start?: Date;
  end?: Date;
  customerId?: string;
  assigneeId?: string;
  categoryId?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
}

const RESOLVED_STATUSES: TicketStatus[] = ['RESOLVIDO', 'ENCERRADO'];

function buildWhere(filters: ReportFilters): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};

  if (filters.start || filters.end) {
    where.createdAt = {
      ...(filters.start ? { gte: filters.start } : {}),
      ...(filters.end ? { lte: filters.end } : {}),
    };
  }
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.priority) where.priority = filters.priority;
  if (filters.status) where.status = filters.status;

  return where;
}

export const reportRepository = {
  async summary(filters: ReportFilters) {
    const where = buildWhere(filters);
    const tenantId = tenantContext.getTenantId();

    const resolvedFilterSql = Prisma.sql`
      "resolvedAt" IS NOT NULL AND "tenantId" = ${tenantId}
      ${filters.start ? Prisma.sql`AND "createdAt" >= ${filters.start}` : Prisma.empty}
      ${filters.end ? Prisma.sql`AND "createdAt" <= ${filters.end}` : Prisma.empty}
      ${filters.customerId ? Prisma.sql`AND "customerId" = ${filters.customerId}` : Prisma.empty}
      ${filters.assigneeId ? Prisma.sql`AND "assigneeId" = ${filters.assigneeId}` : Prisma.empty}
      ${filters.categoryId ? Prisma.sql`AND "categoryId" = ${filters.categoryId}` : Prisma.empty}
      ${filters.priority ? Prisma.sql`AND "priority" = ${filters.priority}::"TicketPriority"` : Prisma.empty}
      ${filters.status ? Prisma.sql`AND "status" = ${filters.status}::"TicketStatus"` : Prisma.empty}
    `;

    const [total, byStatus, resolutionAgg, byCustomerRaw, byCategoryRaw, byAssigneeRaw] = await Promise.all([
      tenantPrisma.ticket.count({ where }),
      tenantPrisma.ticket.groupBy({ by: ['status'], where, _count: { _all: true } }),
      // $queryRaw não passa pela extension de tenant scope — filtro manual (resolvedFilterSql acima).
      prisma.$queryRaw<{ avg_hours: number | null; within_sla: bigint; sla_total: bigint }[]>`
        SELECT
          AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600.0) AS avg_hours,
          COUNT(*) FILTER (WHERE "slaDueAt" IS NOT NULL AND "resolvedAt" <= "slaDueAt") AS within_sla,
          COUNT(*) FILTER (WHERE "slaDueAt" IS NOT NULL) AS sla_total
        FROM "tickets"
        WHERE ${resolvedFilterSql}
      `,
      tenantPrisma.ticket.groupBy({ by: ['customerId'], where, _count: { _all: true } }),
      tenantPrisma.ticket.groupBy({ by: ['categoryId'], where, _count: { _all: true } }),
      tenantPrisma.ticket.groupBy({ by: ['assigneeId'], where, _count: { _all: true } }),
    ]);

    const resolvedCount = byStatus
      .filter((row) => RESOLVED_STATUSES.includes(row.status))
      .reduce((sum, row) => sum + row._count._all, 0);
    const openCount = total - resolvedCount;

    const customerIds = byCustomerRaw.map((row) => row.customerId).filter((id): id is string => !!id);
    const categoryIds = byCategoryRaw.map((row) => row.categoryId).filter((id): id is string => !!id);
    const assigneeIds = byAssigneeRaw.map((row) => row.assigneeId).filter((id): id is string => !!id);

    const [customers, categories, assignees] = await Promise.all([
      customerIds.length
        ? tenantPrisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, companyName: true, tradeName: true } })
        : [],
      categoryIds.length
        ? tenantPrisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } })
        : [],
      assigneeIds.length
        ? tenantPrisma.user.findMany({ where: { id: { in: assigneeIds } }, select: { id: true, name: true } })
        : [],
    ]);

    const customerById = new Map(customers.map((c) => [c.id, c]));
    const categoryById = new Map(categories.map((c) => [c.id, c]));
    const assigneeById = new Map(assignees.map((a) => [a.id, a]));

    return {
      totals: {
        total,
        open: openCount,
        resolved: resolvedCount,
        avgResolutionHours: Math.round((resolutionAgg[0]?.avg_hours ?? 0) * 10) / 10,
        slaCompliancePercent:
          resolutionAgg[0] && Number(resolutionAgg[0].sla_total) > 0
            ? Math.round((Number(resolutionAgg[0].within_sla) / Number(resolutionAgg[0].sla_total)) * 1000) / 10
            : null,
      },
      byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
      byCustomer: byCustomerRaw
        .filter((row) => row.customerId)
        .map((row) => ({
          customerId: row.customerId as string,
          name: customerById.get(row.customerId as string)?.tradeName ?? customerById.get(row.customerId as string)?.companyName ?? '—',
          count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      byCategory: byCategoryRaw
        .map((row) => ({
          categoryId: row.categoryId,
          name: row.categoryId ? (categoryById.get(row.categoryId)?.name ?? '—') : 'Sem categoria',
          count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count),
      byAssignee: byAssigneeRaw
        .map((row) => ({
          assigneeId: row.assigneeId,
          name: row.assigneeId ? (assigneeById.get(row.assigneeId)?.name ?? '—') : 'Não atribuído',
          count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count),
    };
  },

  async listForExport(filters: ReportFilters) {
    const where = buildWhere(filters);
    return tenantPrisma.ticket.findMany({
      where,
      include: {
        customer: { select: { companyName: true, tradeName: true } },
        assignee: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 2000,
    });
  },
};
