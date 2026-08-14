import { Prisma, TicketPriority, TicketStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';

export interface TicketListFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
  customerId?: string;
  categoryId?: string;
  search?: string;
}

export interface TicketListOptions {
  page: number;
  pageSize: number;
  sortBy: 'createdAt' | 'updatedAt' | 'number' | 'priority' | 'slaDueAt';
  sortOrder: 'asc' | 'desc';
}

const listInclude = {
  customer: { select: { id: true, companyName: true, tradeName: true } },
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  category: { select: { id: true, name: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.TicketInclude;

const detailInclude = {
  customer: true,
  assignee: { select: { id: true, name: true, avatarUrl: true, email: true } },
  creator: { select: { id: true, name: true, avatarUrl: true } },
  category: true,
  slaRule: true,
  tags: { include: { tag: true } },
  attachments: { orderBy: { createdAt: 'desc' } },
  comments: {
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  },
  history: {
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  },
} satisfies Prisma.TicketInclude;

function buildWhere(filters: TicketListFilters): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.categoryId) where.categoryId = filters.categoryId;

  if (filters.search) {
    const search = filters.search;
    const asNumber = Number(search);
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      ...(Number.isFinite(asNumber) && search.trim() !== '' ? [{ number: asNumber }] : []),
    ];
  }

  return where;
}

export const ticketRepository = {
  async list(filters: TicketListFilters, options: TicketListOptions) {
    const where = buildWhere(filters);

    const [items, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: listInclude,
        orderBy: { [options.sortBy]: options.sortOrder },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      prisma.ticket.count({ where }),
    ]);

    return { items, total };
  },

  async listAllForBoard(filters: TicketListFilters) {
    const where = buildWhere(filters);
    return prisma.ticket.findMany({
      where,
      include: listInclude,
      orderBy: { updatedAt: 'desc' },
      take: 300,
    });
  },

  findById(id: string) {
    return prisma.ticket.findUnique({ where: { id }, include: detailInclude });
  },

  findSlaRuleByPriority(priority: TicketPriority) {
    return prisma.slaRule.findUnique({ where: { priority } });
  },

  create(data: Prisma.TicketCreateInput) {
    return prisma.ticket.create({ data, include: detailInclude });
  },

  update(id: string, data: Prisma.TicketUpdateInput) {
    return prisma.ticket.update({ where: { id }, data, include: detailInclude });
  },

  recordHistory(entry: {
    ticketId: string;
    authorId?: string | null;
    action: string;
    fieldName?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
  }) {
    return prisma.ticketHistory.create({ data: entry });
  },

  addComment(data: { ticketId: string; authorId?: string | null; content: string }) {
    return prisma.ticketComment.create({
      data,
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
  },

  addAttachment(data: {
    ticketId: string;
    fileName: string;
    fileUrl: string;
    mimeType?: string | null;
    sizeBytes?: number | null;
  }) {
    return prisma.ticketAttachment.create({ data });
  },
};
