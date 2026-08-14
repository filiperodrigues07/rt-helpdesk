import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export const notificationRepository = {
  list(userId: string, unreadOnly: boolean) {
    return prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  },

  unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, readAt: null } });
  },

  create(data: Prisma.NotificationCreateInput) {
    return prisma.notification.create({ data });
  },

  async markRead(id: string, userId: string) {
    await prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  },

  existsForTicket(userId: string, type: NotificationType, relatedTicketId: string) {
    return prisma.notification.findFirst({
      where: { userId, type, relatedTicketId },
      select: { id: true },
    });
  },

  existsForAppointment(userId: string, type: NotificationType, relatedAppointmentId: string) {
    return prisma.notification.findFirst({
      where: { userId, type, relatedAppointmentId },
      select: { id: true },
    });
  },
};
