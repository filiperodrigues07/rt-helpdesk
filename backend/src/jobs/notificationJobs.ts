// Job periódico (polling) que gera notificações de SLA e agenda.
// Não há push em tempo real — o frontend consulta a API de notificações
// periodicamente (ver useNotifications no frontend).

import { prisma } from '../utils/prisma';
import { notificationService } from '../services/notificationService';

const RESOLVED_STATUSES = ['RESOLVIDO', 'ENCERRADO'] as const;
const SLA_WARNING_WINDOW_MIN = 60;
const AGENDA_WARNING_WINDOW_MIN = 30;

// Chamados sem responsável (todo chamado do TotalChat nasce assim) não têm pra
// quem notificar diretamente — nesse caso avisamos todos os Administradores/
// Gerentes, em vez de deixar o alerta de SLA passar batido só porque ainda
// ninguém pegou o chamado.
async function getAdminRecipients(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { active: true, role: { name: { in: ['ADMINISTRADOR', 'GERENTE'] } } },
    select: { id: true },
  });
  return admins.map((admin) => admin.id);
}

async function notifyTicketRecipients(
  ticket: { id: string; number: number; title: string; assigneeId: string | null },
  type: 'SLA_PROXIMO_VENCIMENTO' | 'SLA_VENCIDO',
  titlePrefix: string,
  adminUserIds: string[],
) {
  const recipientIds = ticket.assigneeId ? [ticket.assigneeId] : adminUserIds;
  for (const userId of recipientIds) {
    await notificationService.notifyOnceForTicket({
      userId,
      type,
      title: `${titlePrefix}: #${ticket.number}`,
      message: ticket.title,
      relatedTicketId: ticket.id,
      relatedUrl: `/chamados/${ticket.id}`,
    });
  }
}

async function checkSlaNotifications() {
  const now = new Date();
  const warningThreshold = new Date(now.getTime() + SLA_WARNING_WINDOW_MIN * 60 * 1000);
  const adminUserIds = await getAdminRecipients();

  const nearingTickets = await prisma.ticket.findMany({
    where: {
      status: { notIn: [...RESOLVED_STATUSES] },
      slaDueAt: { gt: now, lte: warningThreshold },
    },
    select: { id: true, number: true, title: true, assigneeId: true },
  });

  for (const ticket of nearingTickets) {
    await notifyTicketRecipients(ticket, 'SLA_PROXIMO_VENCIMENTO', 'SLA perto de vencer', adminUserIds);
  }

  const overdueTickets = await prisma.ticket.findMany({
    where: {
      status: { notIn: [...RESOLVED_STATUSES] },
      slaDueAt: { lte: now },
    },
    select: { id: true, number: true, title: true, assigneeId: true },
  });

  for (const ticket of overdueTickets) {
    await notifyTicketRecipients(ticket, 'SLA_VENCIDO', 'SLA vencido', adminUserIds);
  }
}

async function checkAgendaNotifications() {
  const now = new Date();
  const soonThreshold = new Date(now.getTime() + AGENDA_WARNING_WINDOW_MIN * 60 * 1000);

  const upcoming = await prisma.appointment.findMany({
    where: {
      assigneeId: { not: null },
      startsAt: { gt: now, lte: soonThreshold },
    },
    select: { id: true, title: true, assigneeId: true, startsAt: true },
  });

  for (const appointment of upcoming) {
    await notificationService.notifyOnceForAppointment({
      userId: appointment.assigneeId as string,
      type: 'EVENTO_AGENDA_PROXIMO',
      title: `Evento em breve: ${appointment.title}`,
      message: `Início às ${appointment.startsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      relatedAppointmentId: appointment.id,
      relatedUrl: '/agenda',
    });
  }
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startNotificationJobs(intervalSeconds = 300) {
  if (timer) return;

  const run = () => {
    checkSlaNotifications().catch((error) => console.error('[notifications] erro ao checar SLA:', error));
    checkAgendaNotifications().catch((error) => console.error('[notifications] erro ao checar agenda:', error));
  };

  run();
  timer = setInterval(run, intervalSeconds * 1000);
  console.log(`[notifications] job periódico iniciado — a cada ${intervalSeconds}s`);
}

export function stopNotificationJobs() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
