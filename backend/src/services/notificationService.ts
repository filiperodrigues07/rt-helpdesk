import { NotificationType } from '@prisma/client';
import { notificationRepository } from '../repositories/notificationRepository';

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  relatedTicketId?: string;
  relatedAppointmentId?: string;
  relatedUrl?: string;
}

export const notificationService = {
  list(userId: string, unreadOnly: boolean) {
    return notificationRepository.list(userId, unreadOnly);
  },

  unreadCount(userId: string) {
    return notificationRepository.unreadCount(userId);
  },

  markRead(id: string, userId: string) {
    return notificationRepository.markRead(id, userId);
  },

  markAllRead(userId: string) {
    return notificationRepository.markAllRead(userId);
  },

  notify(input: NotifyInput) {
    return notificationRepository.create({
      user: { connect: { id: input.userId } },
      type: input.type,
      title: input.title,
      message: input.message,
      relatedTicketId: input.relatedTicketId,
      relatedAppointmentId: input.relatedAppointmentId,
      relatedUrl: input.relatedUrl,
    });
  },

  /** Evita duplicar notificações do mesmo tipo para o mesmo chamado/usuário (usado pelos jobs periódicos). */
  async notifyOnceForTicket(input: NotifyInput & { relatedTicketId: string }) {
    const existing = await notificationRepository.existsForTicket(input.userId, input.type, input.relatedTicketId);
    if (existing) return null;
    return notificationService.notify(input);
  },

  /** Equivalente a notifyOnceForTicket, mas para eventos da agenda. */
  async notifyOnceForAppointment(input: NotifyInput & { relatedAppointmentId: string }) {
    const existing = await notificationRepository.existsForAppointment(
      input.userId,
      input.type,
      input.relatedAppointmentId,
    );
    if (existing) return null;
    return notificationService.notify(input);
  },
};
