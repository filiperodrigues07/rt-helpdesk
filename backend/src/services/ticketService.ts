import { TicketOrigin, TicketPriority, TicketStatus } from '@prisma/client';
import { ticketRepository, TicketListFilters, TicketListOptions } from '../repositories/ticketRepository';
import { userRepository } from '../repositories/userRepository';
import { customerRepository } from '../repositories/customerRepository';
import { notificationService } from './notificationService';
import { totalChatService } from '../integrations/totalchat/service';
import { TotalChatSendTemplateComponent } from '../integrations/totalchat/types';
import { AppError } from '../utils/AppError';
import { env } from '../utils/env';

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

type WhatsAppSendTarget = { clienteId: number } | { telefone: string };

/** Resolve pra quem enviar WhatsApp: contato com id conhecido do TotalChat > telefone de contato > telefone do cliente. */
function resolveCustomerWhatsAppTarget(customer: {
  phone: string | null;
  contacts: { totalchatContactId: string | null; phone: string | null }[];
}): WhatsAppSendTarget | null {
  const contactWithTotalChatId = customer.contacts.find((contact) => contact.totalchatContactId);
  if (contactWithTotalChatId) return { clienteId: Number(contactWithTotalChatId.totalchatContactId) };

  const contactWithPhone = customer.contacts.find((contact) => contact.phone);
  if (contactWithPhone) return { telefone: contactWithPhone.phone as string };

  if (customer.phone) return { telefone: customer.phone };

  return null;
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
  notifyCustomer?: boolean;
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

  /** Exige um contato do TotalChat já vinculado (usado por operações que só existem via clienteId, como templates). */
  async requireKnownContact(id: string) {
    const ticket = await this.getById(id);
    if (!ticket.totalchatContactId) {
      throw new AppError('Envie uma mensagem de texto primeiro para iniciar a conversa com este cliente.', 400);
    }
    return ticket;
  },

  /**
   * Resolve o destinatário da conversa: usa o contato já vinculado ao chamado
   * quando existe; senão tenta resolver pelo cliente (contato com id do
   * TotalChat conhecido, ou telefone). Quando já dá pra saber o clienteId
   * (contato de uma conversa anterior), vincula o chamado imediatamente.
   */
  async resolveConversationTarget(id: string) {
    const ticket = await this.getById(id);
    if (ticket.totalchatContactId) {
      return { ticket, target: { clienteId: Number(ticket.totalchatContactId) } as WhatsAppSendTarget };
    }

    const customer = await customerRepository.findById(ticket.customerId);
    const target = customer ? resolveCustomerWhatsAppTarget(customer) : null;
    if (!target) {
      throw new AppError('Este cliente não tem WhatsApp cadastrado.', 400);
    }

    if ('clienteId' in target) {
      await ticketRepository.update(id, { totalchatContactId: String(target.clienteId) });
    }

    return { ticket, target };
  },

  async getConversation(id: string) {
    const { ticket, target } = await this.resolveConversationTarget(id);

    const messages =
      'clienteId' in target
        ? await totalChatService.getConversation(target.clienteId)
        : await totalChatService.getConversationByPhone(target.telefone);

    // GetMensagens devolve o histórico inteiro do contato no TotalChat (pode ter
    // anos e milhares de mensagens de outros atendimentos) — não é escopado por
    // atendimento/ticket. Filtramos pra janela deste chamado: da criação (com
    // uma folga de 24h pra garantir que a mensagem que disparou o chamado entre)
    // até agora.
    const cutoff = new Date(ticket.createdAt.getTime() - 24 * 60 * 60 * 1000).toISOString();
    return messages.filter((message) => !message.timestamp || message.timestamp >= cutoff);
  },

  async sendMessage(
    id: string,
    actorId: string,
    input: { content?: string; files: { buffer: Buffer; fileName: string; mimeType: string }[] },
  ) {
    const { target } = await this.resolveConversationTarget(id);

    const result = await totalChatService.sendFreeformMessage(target, { text: input.content, files: input.files });

    if ('telefone' in target && result.clienteId) {
      await ticketRepository.update(id, { totalchatContactId: String(result.clienteId) });
    }

    await ticketRepository.recordHistory({
      ticketId: id,
      authorId: actorId,
      action: 'MENSAGEM_ENVIADA_CLIENTE',
      newValue: input.content?.slice(0, 200) || `${input.files.length} arquivo(s) enviado(s)`,
    });
  },

  async listWhatsAppTemplates(id: string, after?: string) {
    await this.requireKnownContact(id);
    return totalChatService.listWhatsAppTemplates(after);
  },

  async getWhatsAppTemplate(id: string, templateId: string) {
    await this.requireKnownContact(id);
    return totalChatService.getWhatsAppTemplate(templateId);
  },

  async uploadTemplateHeaderImage(id: string, relativePath: string) {
    await this.requireKnownContact(id);
    if (!env.appPublicUrl) {
      throw new AppError(
        'APP_PUBLIC_URL não está configurada — imagem de cabeçalho de template exige uma URL pública.',
        400,
      );
    }
    return `${env.appPublicUrl.replace(/\/$/, '')}${relativePath}`;
  },

  async sendWhatsAppTemplate(
    id: string,
    actorId: string,
    input: { templateName: string; language: string; components: TotalChatSendTemplateComponent[] },
  ) {
    const ticket = await this.requireKnownContact(id);
    await totalChatService.sendWhatsAppTemplate(Number(ticket.totalchatContactId), input);

    await ticketRepository.recordHistory({
      ticketId: id,
      authorId: actorId,
      action: 'MENSAGEM_ENVIADA_CLIENTE',
      newValue: `Template: ${input.templateName}`,
    });
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

    if (input.notifyCustomer) {
      this.notifyCustomerOfNewTicket(ticket, input.creatorId).catch((error) => {
        console.error('Falha ao avisar cliente por WhatsApp sobre o novo chamado:', error);
      });
    }

    return ticketRepository.findById(ticket.id);
  },

  async notifyCustomerOfNewTicket(
    ticket: { id: string; number: number; title: string; customerId: string },
    actorId: string,
  ) {
    const customer = await customerRepository.findById(ticket.customerId);
    const target = customer ? resolveCustomerWhatsAppTarget(customer) : null;
    if (!target) return;

    const message = `Olá! Seu chamado #${ticket.number} foi registrado: "${ticket.title}". Em breve nossa equipe vai te atender.`;
    const result = await totalChatService.sendFreeformMessage(target, { text: message, files: [] });

    const clienteId = 'clienteId' in target ? target.clienteId : result.clienteId;
    if (clienteId) {
      await ticketRepository.update(ticket.id, { totalchatContactId: String(clienteId) });
    }

    await ticketRepository.recordHistory({
      ticketId: ticket.id,
      authorId: actorId,
      action: 'MENSAGEM_ENVIADA_CLIENTE',
      newValue: message,
    });
  },

  async update(id: string, input: UpdateTicketInput, actorId: string) {
    const current = await this.getById(id);

    if (
      RESOLVED_STATUSES.includes(current.status) &&
      (input.priority !== undefined || input.assigneeId !== undefined || input.categoryId !== undefined)
    ) {
      throw new AppError(
        'Este chamado está resolvido ou encerrado. Reabra o chamado para alterar prioridade, responsável ou categoria.',
        400,
      );
    }

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

    if (RESOLVED_STATUSES.includes(current.status)) {
      throw new AppError(
        'Este chamado está resolvido ou encerrado. Use "Reabrir chamado" para retomar o atendimento.',
        400,
      );
    }

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

    if (RESOLVED_STATUSES.includes(current.status)) {
      throw new AppError('Este chamado já está resolvido ou encerrado.', 400);
    }

    const resolvedAt = new Date();
    const ticket = await ticketRepository.update(id, {
      status: 'RESOLVIDO',
      resolvedProblem: input.resolvedProblem,
      rootCause: input.rootCause,
      appliedSolution: input.appliedSolution,
      observations: input.observations,
      resolvedAt,
      closedAt: null,
    });

    await ticketRepository.recordHistory({
      ticketId: id,
      authorId: actorId,
      action: 'CHAMADO_RESOLVIDO',
      fieldName: 'status',
      oldValue: STATUS_LABELS[current.status],
      newValue: STATUS_LABELS.RESOLVIDO,
    });

    await this.notifyTicketParties(current, ticket, actorId, `Chamado resolvido: #${ticket.number}`);
    return ticket;
  },

  async close(id: string, actorId: string) {
    const current = await this.getById(id);

    if (current.status !== 'RESOLVIDO') {
      throw new AppError('Encerrar só é permitido depois que o chamado estiver Resolvido.', 400);
    }

    const closedAt = new Date();
    const ticket = await ticketRepository.update(id, { status: 'ENCERRADO', closedAt });

    await ticketRepository.recordHistory({
      ticketId: id,
      authorId: actorId,
      action: 'CHAMADO_ENCERRADO',
      fieldName: 'status',
      oldValue: STATUS_LABELS.RESOLVIDO,
      newValue: STATUS_LABELS.ENCERRADO,
    });

    await this.notifyTicketParties(current, ticket, actorId, `Chamado encerrado: #${ticket.number}`);
    return ticket;
  },

  async reopen(id: string, reason: string | undefined, actorId: string) {
    const current = await this.getById(id);

    if (!RESOLVED_STATUSES.includes(current.status)) {
      throw new AppError('Apenas chamados resolvidos ou encerrados podem ser reabertos.', 400);
    }

    const slaRule = await ticketRepository.findSlaRuleByPriority(current.priority);
    const reopenedAt = new Date();
    const slaDueAt = slaRule ? new Date(reopenedAt.getTime() + slaRule.responseTimeMin * 60 * 1000) : null;

    const ticket = await ticketRepository.update(id, {
      status: 'EM_ANDAMENTO',
      resolvedProblem: null,
      rootCause: null,
      appliedSolution: null,
      observations: null,
      resolvedAt: null,
      closedAt: null,
      slaRule: slaRule ? { connect: { id: slaRule.id } } : { disconnect: true },
      slaDueAt,
    });

    await ticketRepository.recordHistory({
      ticketId: id,
      authorId: actorId,
      action: 'CHAMADO_REABERTO',
      fieldName: 'status',
      oldValue: STATUS_LABELS[current.status],
      newValue: STATUS_LABELS.EM_ANDAMENTO,
    });

    if (current.resolvedProblem || current.rootCause || current.appliedSolution) {
      await ticketRepository.recordHistory({
        ticketId: id,
        authorId: actorId,
        action: 'SOLUCAO_ARQUIVADA',
        fieldName: 'resolucao',
        oldValue: [
          current.resolvedProblem ? `Problema: ${current.resolvedProblem}` : null,
          current.rootCause ? `Causa raiz: ${current.rootCause}` : null,
          current.appliedSolution ? `Solução: ${current.appliedSolution}` : null,
          current.observations ? `Observações: ${current.observations}` : null,
        ]
          .filter(Boolean)
          .join(' | '),
      });
    }

    if (reason) {
      await ticketRepository.recordHistory({
        ticketId: id,
        authorId: actorId,
        action: 'CHAMADO_REABERTO',
        fieldName: 'motivo',
        newValue: reason,
      });
    }

    await this.notifyTicketParties(current, ticket, actorId, `Chamado reaberto: #${ticket.number}`);
    return ticket;
  },

  async notifyTicketParties(
    before: { assigneeId: string | null; creatorId: string | null },
    ticket: { id: string; number: number; title: string },
    actorId: string,
    title: string,
  ) {
    const recipients = new Set<string>();
    if (before.assigneeId && before.assigneeId !== actorId) recipients.add(before.assigneeId);
    if (before.creatorId && before.creatorId !== actorId) recipients.add(before.creatorId);

    for (const userId of recipients) {
      await notificationService.notify({
        userId,
        type: 'CHAMADO_ATUALIZADO',
        title,
        message: ticket.title,
        relatedTicketId: ticket.id,
        relatedUrl: `/chamados/${ticket.id}`,
      });
    }
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
