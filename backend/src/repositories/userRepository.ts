import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { tenantPrisma } from '../utils/tenantPrisma';
import { tenantContext } from '../utils/tenantContext';

export const userRepository = {
  // Roda no login, antes de existir tenant autenticado na requisição — por
  // isso usa o client global, não o escopado (ver decisão em prisma/schema.prisma:
  // User.email fica único globalmente de propósito).
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: true } }, tenant: { select: { active: true } } },
    });
  },

  findById(id: string) {
    return tenantPrisma.user.findUnique({
      where: { id },
      include: { role: { include: { permissions: true } } },
    });
  },

  list() {
    return tenantPrisma.user.findMany({
      include: { role: true },
      orderBy: { name: 'asc' },
    });
  },

  create(data: Prisma.UserCreateInput) {
    return tenantPrisma.user.create({ data, include: { role: true } });
  },

  update(id: string, data: Prisma.UserUpdateInput) {
    return tenantPrisma.user.update({ where: { id }, data, include: { role: true } });
  },

  async delete(id: string) {
    await tenantPrisma.user.delete({ where: { id } });
  },

  async getProductivityStats() {
    const RESOLVED_STATUSES: Prisma.TicketWhereInput['status'] = { in: ['RESOLVIDO', 'ENCERRADO'] };
    const tenantId = tenantContext.getTenantId();

    const [assignedCounts, resolvedCounts, avgRows, slaRows] = await Promise.all([
      tenantPrisma.ticket.groupBy({
        by: ['assigneeId'],
        where: { assigneeId: { not: null } },
        _count: { _all: true },
      }),
      tenantPrisma.ticket.groupBy({
        by: ['assigneeId'],
        where: { assigneeId: { not: null }, status: RESOLVED_STATUSES },
        _count: { _all: true },
      }),
      // $queryRaw não passa pela extension de tenant scope — filtro manual.
      prisma.$queryRaw<{ assigneeId: string; avg_hours: number | null }[]>`
        SELECT "assigneeId", AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600.0) AS avg_hours
        FROM "tickets"
        WHERE "assigneeId" IS NOT NULL AND "resolvedAt" IS NOT NULL AND "tenantId" = ${tenantId}
        GROUP BY "assigneeId"
      `,
      prisma.$queryRaw<{ assigneeId: string; within_sla: bigint; total: bigint }[]>`
        SELECT "assigneeId",
               COUNT(*) FILTER (WHERE "resolvedAt" <= "slaDueAt") AS within_sla,
               COUNT(*) AS total
        FROM "tickets"
        WHERE "assigneeId" IS NOT NULL AND "resolvedAt" IS NOT NULL AND "slaDueAt" IS NOT NULL AND "tenantId" = ${tenantId}
        GROUP BY "assigneeId"
      `,
    ]);

    const assignedMap = new Map(assignedCounts.map((row) => [row.assigneeId as string, row._count._all]));
    const resolvedMap = new Map(resolvedCounts.map((row) => [row.assigneeId as string, row._count._all]));
    const avgMap = new Map(avgRows.map((row) => [row.assigneeId, row.avg_hours ?? 0]));
    const slaMap = new Map(
      slaRows.map((row) => [
        row.assigneeId,
        row.total > 0n ? Math.round((Number(row.within_sla) / Number(row.total)) * 1000) / 10 : null,
      ]),
    );

    return { assignedMap, resolvedMap, avgMap, slaMap };
  },
};
