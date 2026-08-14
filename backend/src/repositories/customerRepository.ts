import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export interface CustomerListFilters {
  search?: string;
}

export interface CustomerListOptions {
  page: number;
  pageSize: number;
}

function buildWhere(filters: CustomerListFilters): Prisma.CustomerWhereInput {
  if (!filters.search) return {};

  const search = filters.search;
  return {
    OR: [
      { companyName: { contains: search, mode: 'insensitive' } },
      { tradeName: { contains: search, mode: 'insensitive' } },
      { cnpj: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ],
  };
}

export const customerRepository = {
  async list(filters: CustomerListFilters, options: CustomerListOptions) {
    const where = buildWhere(filters);

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { _count: { select: { tickets: true, appointments: true } } },
        orderBy: { companyName: 'asc' },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      prisma.customer.count({ where }),
    ]);

    return { items, total };
  },

  listMinimal() {
    return prisma.customer.findMany({
      select: { id: true, companyName: true, tradeName: true, city: true },
      orderBy: { companyName: 'asc' },
    });
  },

  findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: { contacts: true },
    });
  },

  findByCnpj(cnpj: string) {
    return prisma.customer.findUnique({ where: { cnpj } });
  },

  create(data: Prisma.CustomerCreateInput) {
    return prisma.customer.create({ data });
  },

  update(id: string, data: Prisma.CustomerUpdateInput) {
    return prisma.customer.update({ where: { id }, data });
  },

  countTickets(id: string) {
    return prisma.ticket.count({ where: { customerId: id } });
  },

  async delete(id: string) {
    await prisma.customer.delete({ where: { id } });
  },

  async getIndicators(customerId: string) {
    const [byStatus, resolvedAgg, byAssigneeRaw, appointments, recentTickets] = await Promise.all([
      prisma.ticket.groupBy({ by: ['status'], where: { customerId }, _count: { _all: true } }),
      prisma.$queryRaw<{ avg_hours: number | null }[]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600.0) AS avg_hours
        FROM "tickets"
        WHERE "customerId" = ${customerId} AND "resolvedAt" IS NOT NULL
      `,
      prisma.ticket.groupBy({
        by: ['assigneeId'],
        where: { customerId, assigneeId: { not: null } },
        _count: { _all: true },
      }),
      prisma.appointment.findMany({
        where: { customerId },
        orderBy: { startsAt: 'desc' },
        take: 10,
        include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
      }),
      prisma.ticket.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          category: { select: { id: true, name: true } },
        },
      }),
    ]);

    const assigneeIds = byAssigneeRaw.map((row) => row.assigneeId).filter((id): id is string => !!id);
    const assignees = assigneeIds.length
      ? await prisma.user.findMany({ where: { id: { in: assigneeIds } }, select: { id: true, name: true, avatarUrl: true } })
      : [];
    const assigneeById = new Map(assignees.map((user) => [user.id, user]));

    return {
      byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
      avgResolutionHours: Math.round((resolvedAgg[0]?.avg_hours ?? 0) * 10) / 10,
      responsaveis: byAssigneeRaw
        .filter((row) => row.assigneeId)
        .map((row) => ({
          user: assigneeById.get(row.assigneeId as string) ?? null,
          count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count),
      appointments,
      recentTickets,
    };
  },
};
