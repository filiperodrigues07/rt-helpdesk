// Lógica de negócio da integração com o TotalChat.
//
// Não existe webhook nesta API (ver client.ts) — a sincronização de chamados
// é feita por polling: buscamos periodicamente as mensagens não lidas de
// todos os clientes e, para cada cliente com mensagens novas, criamos ou
// atualizamos um chamado no RT HELPDESK.
//
// Limitações conhecidas, por falta de informação na documentação oficial:
// - Não há um "id de atendimento" confiável disponível a partir das mensagens
//   não lidas, então `Ticket.totalchatConversationId` fica vazio por enquanto.
// - `GetTodasMensagensNaoLidas` com marcaLida=true já marca as mensagens como
//   lidas na própria chamada; se o processamento falhar depois de buscar mas
//   antes de salvar no banco, a mensagem pode não ser reprocessada. Aceitável
//   para uma primeira versão — revisar se isso causar perda de chamados.
// - Prioridade e categoria não podem ser inferidas do texto da mensagem, então
//   todo chamado automático nasce com prioridade NORMAL e sem categoria.
// - Responsável não é atribuído automaticamente (sem regra definida ainda).

import { prisma } from '../../utils/prisma';
import { env } from '../../utils/env';
import { totalChatClient } from './client';
import { TotalChatMensagem } from './types';

const MAX_PAGES_PER_SYNC = 10;

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function phonesMatch(a: string, b: string): boolean {
  const normA = normalizePhone(a);
  const normB = normalizePhone(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  // Compara os últimos 8 dígitos (número local) para tolerar DDI/DDD divergentes.
  return normA.slice(-8) === normB.slice(-8);
}

async function findOrCreateCustomerContact(clienteId: number, nome: string, telefone: string) {
  const existingByTotalChatId = await prisma.customerContact.findFirst({
    where: { totalchatContactId: String(clienteId) },
    include: { customer: true },
  });
  if (existingByTotalChatId) return existingByTotalChatId;

  const candidates = await prisma.customerContact.findMany({
    where: { phone: { not: null } },
    include: { customer: true },
  });
  const matchByPhone = candidates.find((contact) => contact.phone && phonesMatch(contact.phone, telefone));

  if (matchByPhone) {
    return prisma.customerContact.update({
      where: { id: matchByPhone.id },
      data: { totalchatContactId: String(clienteId) },
      include: { customer: true },
    });
  }

  // Nenhum cliente cadastrado corresponde a este contato do TotalChat.
  // Cria um Customer mínimo automaticamente (decisão do usuário em 2026-08-14).
  const customer = await prisma.customer.create({
    data: {
      companyName: nome || telefone,
      phone: telefone,
      notes: 'Criado automaticamente a partir de um contato do TotalChat.',
    },
  });

  return prisma.customerContact.create({
    data: {
      customerId: customer.id,
      name: nome || telefone,
      phone: telefone,
      totalchatContactId: String(clienteId),
    },
    include: { customer: true },
  });
}

async function findOpenTicketForContact(clienteId: number) {
  return prisma.ticket.findFirst({
    where: {
      totalchatContactId: String(clienteId),
      status: { notIn: ['RESOLVIDO', 'ENCERRADO'] },
    },
    orderBy: { createdAt: 'desc' },
  });
}

function messagesToDescription(messages: TotalChatMensagem[]): string {
  return messages
    .filter((msg) => msg.s === 0)
    .map((msg) => msg.m)
    .filter(Boolean)
    .join('\n')
    .slice(0, 4000);
}

async function processContactMessages(clienteId: number, messages: TotalChatMensagem[]) {
  const contato = await totalChatClient.getContatoPorId(clienteId);
  const contact = await findOrCreateCustomerContact(clienteId, contato.nome, contato.telefone);

  const description = messagesToDescription(messages) || '(mensagem sem texto — anexo/mídia)';
  const lastMessage = messages[messages.length - 1];

  const existingTicket = await findOpenTicketForContact(clienteId);

  if (existingTicket) {
    await prisma.ticketComment.create({
      data: {
        ticketId: existingTicket.id,
        content: `Nova(s) mensagem(ns) recebida(s) via TotalChat:\n${description}`,
        visibility: 'CLIENTE',
      },
    });
    await prisma.ticketHistory.create({
      data: {
        ticketId: existingTicket.id,
        action: 'CHAMADO_ATUALIZADO',
        newValue: 'Nova mensagem recebida via TotalChat',
      },
    });
    await prisma.ticket.update({
      where: { id: existingTicket.id },
      data: { totalchatMessageId: lastMessage ? String(lastMessage.d) : existingTicket.totalchatMessageId },
    });
    return { action: 'updated' as const, ticketId: existingTicket.id };
  }

  const slaRule = await prisma.slaRule.findUnique({ where: { priority: 'NORMAL' } });
  const createdAt = new Date();
  const slaDueAt = slaRule ? new Date(createdAt.getTime() + slaRule.responseTimeMin * 60 * 1000) : null;

  const ticket = await prisma.ticket.create({
    data: {
      title: `Atendimento via TotalChat — ${contato.nome || contato.telefone}`,
      description,
      customerId: contact.customerId,
      priority: 'NORMAL',
      status: 'NOVO',
      origin: 'TOTALCHAT',
      totalchatContactId: String(clienteId),
      totalchatMessageId: lastMessage ? String(lastMessage.d) : null,
      slaRuleId: slaRule?.id,
      slaDueAt,
    },
  });

  await prisma.ticketHistory.create({
    data: { ticketId: ticket.id, action: 'CHAMADO_CRIADO', newValue: 'Origem: TotalChat' },
  });

  return { action: 'created' as const, ticketId: ticket.id };
}

export const totalChatService = {
  async getIntegrationStatus() {
    return {
      provider: 'TOTALCHAT' as const,
      status: totalChatClient.isConfigured() ? 'CONECTADO' : 'AGUARDANDO_CONFIGURACAO',
    };
  },

  async testConnection() {
    await totalChatClient.testLogin();
    return { configured: true };
  },

  async syncTickets() {
    if (!totalChatClient.isConfigured()) {
      return { skipped: true, reason: 'not_configured' as const };
    }

    const messagesByClient = new Map<number, TotalChatMensagem[]>();

    for (let pag = 0; pag < MAX_PAGES_PER_SYNC; pag++) {
      const page = await totalChatClient.getTodasMensagensNaoLidas(pag, true);
      if (page.length === 0) break;

      for (const message of page) {
        const list = messagesByClient.get(message.i) ?? [];
        list.push(message);
        messagesByClient.set(message.i, list);
      }

      if (page.length < 70) break;
    }

    const results: { clienteId: number; action: 'created' | 'updated' | 'error'; ticketId?: string; error?: string }[] = [];

    for (const [clienteId, messages] of messagesByClient) {
      try {
        const result = await processContactMessages(clienteId, messages);
        results.push({ clienteId, ...result });
      } catch (error) {
        results.push({ clienteId, action: 'error', error: error instanceof Error ? error.message : String(error) });
      }
    }

    return { skipped: false as const, processedContacts: messagesByClient.size, results };
  },
};

let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startTotalChatPolling() {
  if (!env.totalChat.pollingEnabled) return;
  if (!totalChatClient.isConfigured()) {
    console.warn('[totalchat] polling habilitado mas TOTALCHAT_USERNAME/PASSWORD não configurados — ignorando.');
    return;
  }
  if (pollTimer) return;

  const intervalMs = env.totalChat.pollIntervalSeconds * 1000;
  console.log(`[totalchat] polling iniciado — a cada ${env.totalChat.pollIntervalSeconds}s`);

  pollTimer = setInterval(() => {
    totalChatService.syncTickets().catch((error) => {
      console.error('[totalchat] erro na sincronização periódica:', error);
    });
  }, intervalMs);
}

export function stopTotalChatPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
