import { TicketOrigin, TicketPriority, TicketStatus } from '@prisma/client';
import { ticketRepository, TicketListFilters, TicketListOptions } from '../repositories/ticketRepository';
import { userRepository } from '../repositories/userRepository';
import { notificationService } from './notificationService';
import { totalChatService } from '../integrations/totalchat/service';
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

/** Detecta menções "@Nome" ou "@Nome Sobrenome" no texto e casa com usuários ativos (exceto o autor). */
async function findMentionedUsers(content: string, authorId: string) {
  const mentionMatches = content.match(/@[\p{L}]+(?:\s[\p{L}]+)?/gu) ?? [];
  if (mentionMatches.length === 0) return [];

  const mentionedNames = mentionMatches.map((match) => match.slice(1).trim().toLowerCase());
  const users = await userRepository.list();

  const matched = new Map<string, { id: string; name: string }>();
  for (const user of users) {
    if (user.id === authorId || !user.active) continue;
    const fullName = user.name.toLowerCase();
    const firstName = fullName.split(' ')[0];
    if (mentionedNames.some((mention) => mention === fullName || mention === firstName)) {
      matched.set(user.id, { id: user.id, name: user.name });
    }
  }
  return [...matched.values()];
}

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

  async getConversation(id: string) {
    const ticket = await this.getById(id);
    if (ticket.origin !== 'TOTALCHAT' || !ticket.totalchatContactId) {
      throw new AppError('Este chamado não tem uma conversa do TotalChat vinculada', 400);
    }

    const messages = await totalChatService.getConversation(Number(ticket.totalchatContactId));

    // GetMensagens devolve o histórico inteiro do contato no TotalChat (pode ter
    // anos e milhares de mensagens de outros atendimentos) — não é escopado por
    // atendimento/ticket. Filtramos pra janela deste chamado: da criação (com
    // uma folga de 24h pra garantir que a mensagem que disparou o chamado entre)
    // até agora.
    const cutoff = new Date(ticket.createdAt.getTime() - 24 * 60 * 60 * 1000).toISOString();
    return messages.filter((message) => !message.timestamp || message.timestamp >= cutoff);
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

      if (input.assigneeId !== input.creatorId) {
        await notificationService.notify({
          userId: input.assigneeId,
          type: 'CHAMADO_ATRIBUIDO',
          title: `Novo chamado atribuído: #${ticket.number}`,
          message: ticket.title,
          relatedTicketId: ticket.id,
          relatedUrl: `/chamados/${ticket.id}`,
        });
      }
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

    if (
      input.assigneeId !== undefined &&
      input.assigneeId &&
      input.assigneeId !== current.assigneeId &&
      input.assigneeId !== actorId
    ) {
      await notificationService.notify({
        userId: input.assigneeId,
        type: 'RESPONSAVEL_ALTERADO',
        title: `Você foi definido como responsável: #${ticket.number}`,
        message: ticket.title,
        relatedTicketId: ticket.id,
        relatedUrl: `/chamados/${ticket.id}`,
      });
    } else if (
      current.assigneeId &&
      current.assigneeId !== actorId &&
      ((input.priority && input.priority !== current.priority) ||
        (input.categoryId !== undefined && input.categoryId !== current.categoryId))
    ) {
      await notificationService.notify({
        userId: current.assigneeId,
        type: 'CHAMADO_ATUALIZADO',
        title: `Chamado atualizado: #${ticket.number}`,
        message: ticket.title,
        relatedTicketId: ticket.id,
        relatedUrl: `/chamados/${ticket.id}`,
      });
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

    if (current.assigneeId && current.assigneeId !== actorId) {
      await notificationService.notify({
        userId: current.assigneeId,
        type: 'CHAMADO_ATUALIZADO',
        title: `Chamado atualizado: #${current.number}`,
        message: `Status alterado para ${STATUS_LABELS[status]}`,
        relatedTicketId: id,
        relatedUrl: `/chamados/${id}`,
      });
    }

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
    const ticket = await this.getById(ticketId);
    const comment = await ticketRepository.addComment({ ticketId, authorId, content });
    await ticketRepository.recordHistory({
      ticketId,
      authorId,
      action: 'COMENTARIO_ADICIONADO',
    });

    const mentioned = await findMentionedUsers(content, authorId);
    for (const user of mentioned) {
      await notificationService.notify({
        userId: user.id,
        type: 'MENCAO_COMENTARIO',
        title: `Você foi mencionado no chamado #${ticket.number}`,
        message: content.slice(0, 200),
        relatedTicketId: ticketId,
        relatedUrl: `/chamados/${ticketId}`,
      });
    }

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
