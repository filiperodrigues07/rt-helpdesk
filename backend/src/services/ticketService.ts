import { TicketOrigin, TicketPriority, TicketStatus } from '@prisma/client';
import { ticketRepository, TicketListFilters, TicketListOptions } from '../repositories/ticketRepository';
import { AppError } from '../utils/AppError';

const RESOLVED_STATUSES: TicketStatus[] = ['RESOLVIDO', 'ENCERRADO'];

const STATUS_LABELS: Record<TicketStatus, string> = {
  NOVO: 'Novo',
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_CLIENTE: 'Aguardando cliente',
  AGUARDANDO_TERCEIRO: 'Aguardando terceiro',
  RESOLVIDO: 'Resolvido',
  ENCERRADO: 'Encerrado',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  BAIXA: 'Baixa',
  NORMAL: 'Normal',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

interface CreateTicketInput {
  title: string;
  description: string;
  customerId: string;
  categoryId?: string;
  priority: TicketPriority;
  assigneeId?: string;
  tagIds?: string[];
  creatorId: string;
}

interface UpdateTicketInput {
  title?: string;
  description?: string;
  categoryId?: string | null;
  priority?: TicketPriority;
  assigneeId?: string | null;
  tagIds?: string[];
}

interface ResolveTicketInput {
  status: 'RESOLVIDO' | 'ENCERRADO';
  resolvedProblem: string;
  rootCause: string;
  appliedSolution: string;
  observations?: string;
}

export const ticketService = {
  async list(filters: TicketListFilters, options: TicketListOptions) {
    const { items, total } = await ticketRepository.list(filters, options);
    return {
      items,
      pagination: {
        page: options.page,
        pageSize: options.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / options.pageSize)),
      },
    };
  },

  board(filters: TicketListFilters) {
    return ticketRepository.listAllForBoard(filters);
  },

  async getById(id: string) {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) {
      throw new AppError('Chamado não encontrado', 404);
    }
    return ticket;
  },

  async create(input: CreateTicketInput) {
    const slaRule = await ticketRepository.findSlaRuleByPriority(input.priority);
    const createdAt = new Date();
    const slaDueAt = slaRule ? new Date(createdAt.getTime() + slaRule.responseTimeMin * 60 * 1000) : null;

    const ticket = await ticketRepository.create({
      title: input.title,
      description: input.description,
      customer: { connect: { id: input.customerId } },
      category: input.categoryId ? { connect: { id: input.categoryId } } : undefined,
      priority: input.priority,
      assignee: input.assigneeId ? { connect: { id: input.assigneeId } } : undefined,
      creator: { connect: { id: input.creatorId } },
      origin: TicketOrigin.MANUAL,
      slaRule: slaRule ? { connect: { id: slaRule.id } } : undefined,
      slaDueAt,
      tags: input.tagIds?.length
        ? { create: input.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) }
        : undefined,
    });

    await ticketRepository.recordHistory({
      ticketId: ticket.id,
      authorId: input.creatorId,
      action: 'CHAMADO_CRIADO',
    });

    if (input.assigneeId) {
      await ticketRepository.recordHistory({
        ticketId: ticket.id,
        authorId: input.creatorId,
        action: 'RESPONSAVEL_ATRIBUIDO',
        newValue: ticket.assignee?.name ?? null,
      });
    }

    return ticketRepository.findById(ticket.id);
  },

  async update(id: string, input: UpdateTicketInput, actorId: string) {
    const current = await this.getById(id);

    const historyEntries: Parameters<typeof ticketRepository.recordHistory>[0][] = [];

    if (input.priority && input.priority !== current.priority) {
      historyEntries.push({
        ticketId: id,
        authorId: actorId,
        action: 'PRIORIDADE_ALTERADA',
        fieldName: 'priority',
        oldValue: PRIORITY_LABELS[current.priority],
        newValue: PRIORITY_LABELS[input.priority],
      });
    }

    if (input.assigneeId !== undefined && input.assigneeId !== current.assigneeId) {
      historyEntries.push({
        ticketId: id,
        authorId: actorId,
        action: 'RESPONSAVEL_ALTERADO',
        fieldName: 'assigneeId',
        oldValue: current.assignee?.name ?? 'Não atribuído',
        newValue: input.assigneeId ?? 'Não atribuído',
      });
    }

    if (input.categoryId !== undefined && input.categoryId !== current.categoryId) {
      historyEntries.push({
        ticketId: id,
        authorId: actorId,
        action: 'CATEGORIA_ALTERADA',
        fieldName: 'categoryId',
        oldValue: current.category?.name ?? 'Sem categoria',
        newValue: input.categoryId ?? 'Sem categoria',
      });
    }

    const ticket = await ticketRepository.update(id, {
      title: input.title,
      description: input.description,
      priority: input.priority,
      category:
        input.categoryId === undefined
          ? undefined
          : input.categoryId
            ? { connect: { id: input.categoryId } }
            : { disconnect: true },
      assignee:
        input.assigneeId === undefined
          ? undefined
          : input.assigneeId
            ? { connect: { id: input.assigneeId } }
            : { disconnect: true },
      tags:
        input.tagIds === undefined
          ? undefined
          : {
              deleteMany: {},
              create: input.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
            },
    });

    for (const entry of historyEntries) {
      await ticketRepository.recordHistory(entry);
    }

    return ticket;
  },

  async updateStatus(id: string, status: TicketStatus, actorId: string) {
    const current = await this.getById(id);

    if (RESOLVED_STATUSES.includes(status)) {
      throw new AppError(
        'Para resolver ou encerrar um chamado, use o formulário de solução com problema, causa raiz e solução aplicada.',
        400,
      );
    }

    if (current.status === status) {
      return current;
    }

    const ticket = await ticketRepository.update(id, { status });

    await ticketRepository.recordHistory({
      ticketId: id,
      authorId: actorId,
      action: 'STATUS_ALTERADO',
      fieldName: 'status',
      oldValue: STATUS_LABELS[current.status],
      newValue: STATUS_LABELS[status],
    });

    return ticket;
  },

  async resolve(id: string, input: ResolveTicketInput, actorId: string) {
    const current = await this.getById(id);
    const resolvedAt = new Date();

    const ticket = await ticketRepository.update(id, {
      status: input.status,
      resolvedProblem: input.resolvedProblem,
      rootCause: input.rootCause,
      appliedSolution: input.appliedSolution,
      observations: input.observations,
      resolvedAt,
      closedAt: input.status === 'ENCERRADO' ? resolvedAt : null,
    });

    await ticketRepository.recordHistory({
      ticketId: id,
      authorId: actorId,
      action: input.status === 'ENCERRADO' ? 'CHAMADO_ENCERRADO' : 'CHAMADO_RESOLVIDO',
      fieldName: 'status',
      oldValue: STATUS_LABELS[current.status],
      newValue: STATUS_LABELS[input.status],
    });

    return ticket;
  },

  async addComment(ticketId: string, authorId: string, content: string) {
    await this.getById(ticketId);
    const comment = await ticketRepository.addComment({ ticketId, authorId, content });
    await ticketRepository.recordHistory({
      ticketId,
      authorId,
      action: 'COMENTARIO_ADICIONADO',
    });
    return comment;
  },

  async addAttachment(
    ticketId: string,
    file: { fileName: string; fileUrl: string; mimeType?: string; sizeBytes?: number },
    actorId: string,
  ) {
    await this.getById(ticketId);
    const attachment = await ticketRepository.addAttachment({ ticketId, ...file });
    await ticketRepository.recordHistory({
      ticketId,
      authorId: actorId,
      action: 'ANEXO_ADICIONADO',
      newValue: file.fileName,
    });
    return attachment;
  },
};
