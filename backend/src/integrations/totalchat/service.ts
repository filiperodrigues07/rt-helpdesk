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
// - Prioridade e categoria não podem ser inferidas do texto da mensagem, então
//   todo chamado automático nasce com prioridade NORMAL e sem categoria.
// - Responsável não é atribuído automaticamente (sem regra definida ainda).
//
// `GetTodasMensagensNaoLidas` com marcaLida=true retorna HTTP 400 (bug do
// próprio servidor do TotalChat, confirmado em 2026-08-14 — a chamada segue
// exatamente o formato documentado). Por isso buscamos sempre com
// marcaLida=false e controlamos "o que já foi processado" pelo nosso lado,
// comparando o id de cada mensagem (`d`) com o maior `totalchatMessageId` já
// salvo em algum chamado desse contato. Efeito colateral positivo: paramos de
// marcar mensagens reais dos clientes como lidas no TotalChat.

import { prisma } from '../../utils/prisma';
import { env } from '../../utils/env';
import { encrypt } from '../../utils/crypto';
import { totalChatConfigRepository } from '../../repositories/totalChatConfigRepository';
import { totalChatClient, invalidateConfig } from './client';
import { TotalChatMensagem } from './types';

export interface TotalChatConfigInput {
  apiUrl?: string;
  username?: string;
  password?: string;
  connectionId?: number | null;
  pollingEnabled?: boolean;
  pollIntervalSeconds?: number;
}

const MAX_PAGES_PER_SYNC = 10;
// A API do TotalChat limita a ~2 requisições/segundo (header X-Rate-Limit-Limit: 1s,
// observado em 2026-08-14) — sem essa pausa, o sync estourava o limite (HTTP 429)
// já na segunda página ou no segundo contato processado.
const REQUEST_THROTTLE_MS = 400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function getLastProcessedMessageId(clienteId: number): Promise<number | null> {
  const tickets = await prisma.ticket.findMany({
    where: { totalchatContactId: String(clienteId), totalchatMessageId: { not: null } },
    select: { totalchatMessageId: true },
  });
  if (tickets.length === 0) return null;
  return Math.max(...tickets.map((ticket) => Number(ticket.totalchatMessageId)));
}

function messagesToDescription(messages: TotalChatMensagem[]): string {
  return messages
    .filter((msg) => msg.s === 0)
    .map((msg) => msg.m)
    .filter(Boolean)
    .join('\n')
    .slice(0, 4000);
}

const MAX_CONVERSATION_PAGES = 20; // até ~1400 mensagens — suficiente pra qualquer atendimento

const MEDIA_TYPE_LABELS: Record<number, string> = {
  1: 'imagem',
  2: 'documento',
  3: 'áudio',
};

function parseTotalChatDate(h: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(h);
  if (!match) return null;
  const [, day, month, year, hour, minute] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).toISOString();
}

async function fetchConversationMessages(clienteId: number): Promise<TotalChatMensagem[]> {
  const byId = new Map<number, TotalChatMensagem>();

  for (let pag = 0; pag < MAX_CONVERSATION_PAGES; pag++) {
    if (pag > 0) await delay(REQUEST_THROTTLE_MS);
    const page = await totalChatClient.getMensagens(clienteId, pag);
    if (page.length === 0) break;
    for (const message of page) byId.set(message.d, message);
    if (page.length < 70) break;
  }

  return [...byId.values()].sort((a, b) => a.d - b.d);
}

async function processContactMessages(clienteId: number, messages: TotalChatMensagem[]) {
  const sorted = [...messages].sort((a, b) => a.d - b.d);
  const lastProcessedId = await getLastProcessedMessageId(clienteId);
  const newMessages = lastProcessedId !== null ? sorted.filter((msg) => msg.d > lastProcessedId) : sorted;

  if (newMessages.length === 0) {
    return { action: 'skipped' as const };
  }

  // `GetContatoPorId` retorna `{}` (200 OK, sem erro) para diversos clientes reais e
  // válidos — bug confirmado no servidor do TotalChat em 2026-08-14, na mesma linha do
  // bug do marcaLida. Por isso não confiamos cegamente nele: usamos o nome do contato
  // se vier preenchido e, se não vier, caímos para o campo `f` (nome de quem enviou) da
  // última mensagem recebida, e por último um rótulo genérico — nunca deixamos a
  // sincronização falhar por falta desse dado auxiliar.
  const contato = await totalChatClient.getContatoPorId(clienteId).catch(() => null);
  const fallbackName = [...newMessages].reverse().find((msg) => msg.s === 0)?.f;
  const nome = contato?.nome || fallbackName || `Contato TotalChat #${clienteId}`;
  const telefone = contato?.telefone || '';
  const contact = await findOrCreateCustomerContact(clienteId, nome, telefone);

  const description = messagesToDescription(newMessages) || '(mensagem sem texto — anexo/mídia)';
  const lastMessage = newMessages[newMessages.length - 1];

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
      title: `Atendimento via TotalChat — ${nome}`,
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
  async getConversation(clienteId: number) {
    const messages = await fetchConversationMessages(clienteId);

    const attendantIds = [...new Set(messages.map((m) => m.aid).filter((aid): aid is number => !!aid))];
    const attendants = attendantIds.length
      ? await prisma.user.findMany({
          where: { totalchatAttendantId: { in: attendantIds.map(String) } },
          select: { totalchatAttendantId: true, name: true },
        })
      : [];
    const attendantNameById = new Map(attendants.map((a) => [a.totalchatAttendantId, a.name]));

    return messages.map((message) => ({
      id: message.d,
      direction: message.s === 0 ? ('cliente' as const) : ('equipe' as const),
      senderName:
        message.s === 0
          ? message.f || 'Cliente'
          : (message.aid && attendantNameById.get(String(message.aid))) || message.f || 'Equipe',
      text: message.m || '',
      mediaType: message.tipo ? (MEDIA_TYPE_LABELS[message.tipo] ?? null) : null,
      timestamp: parseTotalChatDate(message.h),
    }));
  },

  async getIntegrationStatus() {
    return {
      provider: 'TOTALCHAT' as const,
      status: (await totalChatClient.isConfigured()) ? 'CONECTADO' : 'AGUARDANDO_CONFIGURACAO',
    };
  },

  async testConnection() {
    await totalChatClient.testLogin();
    return { configured: true };
  },

  async getConfig() {
    const dbConfig = await totalChatConfigRepository.get();
    return {
      apiUrl: dbConfig?.apiUrl || env.totalChat.apiUrl,
      username: dbConfig?.username || env.totalChat.username || '',
      hasPassword: !!(dbConfig?.password || env.totalChat.password),
      connectionId: dbConfig?.connectionId ?? env.totalChat.connectionId ?? null,
      pollingEnabled: dbConfig?.pollingEnabled ?? env.totalChat.pollingEnabled,
      pollIntervalSeconds: dbConfig?.pollIntervalSeconds ?? env.totalChat.pollIntervalSeconds,
    };
  },

  async updateConfig(input: TotalChatConfigInput) {
    await totalChatConfigRepository.upsert({
      apiUrl: input.apiUrl,
      username: input.username,
      ...(input.password ? { password: encrypt(input.password) } : {}),
      connectionId: input.connectionId,
      pollingEnabled: input.pollingEnabled,
      pollIntervalSeconds: input.pollIntervalSeconds,
    });

    invalidateConfig();
    await refreshTotalChatPolling();

    return this.getConfig();
  },

  async listAttendants() {
    if (!(await totalChatClient.isConfigured())) {
      return [];
    }

    const attendants = [];
    for (let pag = 0; pag < 5; pag++) {
      if (pag > 0) await delay(REQUEST_THROTTLE_MS);
      const page = await totalChatClient.listaUsuarios(pag);
      if (page.length === 0) break;
      attendants.push(...page);
      if (page.length < 70) break;
    }

    return attendants.map((attendant) => ({
      id: String(attendant.id),
      nome: attendant.nomeAparente,
      departamento: attendant.nomeDepartamento,
    }));
  },

  async syncTickets() {
    if (!(await totalChatClient.isConfigured())) {
      return { skipped: true, reason: 'not_configured' as const };
    }

    // Com marcaLida=false, as páginas não são estritamente disjuntas — a mesma
    // mensagem pode aparecer em mais de uma página. Dedupe por id da mensagem (`d`).
    const messagesById = new Map<number, TotalChatMensagem>();

    for (let pag = 0; pag < MAX_PAGES_PER_SYNC; pag++) {
      if (pag > 0) await delay(REQUEST_THROTTLE_MS);
      const page = await totalChatClient.getTodasMensagensNaoLidas(pag, false);
      if (page.length === 0) break;

      for (const message of page) {
        messagesById.set(message.d, message);
      }

      if (page.length < 70) break;
    }

    const messagesByClient = new Map<number, TotalChatMensagem[]>();
    for (const message of messagesById.values()) {
      const list = messagesByClient.get(message.i) ?? [];
      list.push(message);
      messagesByClient.set(message.i, list);
    }

    const results: {
      clienteId: number;
      action: 'created' | 'updated' | 'skipped' | 'error';
      ticketId?: string;
      error?: string;
    }[] = [];

    let index = 0;
    for (const [clienteId, messages] of messagesByClient) {
      if (index > 0) await delay(REQUEST_THROTTLE_MS);
      index += 1;
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

export function stopTotalChatPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// Reavalia e reinicia o polling a partir da configuração atual (banco, com
// fallback pro .env) — chamado no boot do servidor e sempre que a configuração
// é salva em Configurações, para o intervalo/liga-desliga valerem na hora.
export async function refreshTotalChatPolling() {
  stopTotalChatPolling();

  const dbConfig = await totalChatConfigRepository.get();
  const pollingEnabled = dbConfig?.pollingEnabled ?? env.totalChat.pollingEnabled;
  const pollIntervalSeconds = dbConfig?.pollIntervalSeconds ?? env.totalChat.pollIntervalSeconds;

  if (!pollingEnabled) return;
  if (!(await totalChatClient.isConfigured())) {
    console.warn('[totalchat] polling habilitado mas usuário/senha não configurados — ignorando.');
    return;
  }

  const intervalMs = pollIntervalSeconds * 1000;
  console.log(`[totalchat] polling iniciado — a cada ${pollIntervalSeconds}s`);

  pollTimer = setInterval(() => {
    totalChatService.syncTickets().catch((error) => {
      console.error('[totalchat] erro na sincronização periódica:', error);
    });
  }, intervalMs);
}
