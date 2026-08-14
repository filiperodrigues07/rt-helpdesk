import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { ok } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError('Usuário não autenticado', 401);
  }
  return req.user;
}

export const notificationController = {
  async list(req: Request, res: Response) {
    const user = requireUser(req);
    const unreadOnly = req.query.unreadOnly === 'true';
    const notifications = await notificationService.list(user.id, unreadOnly);
    return ok(res, notifications);
  },

  async unreadCount(req: Request, res: Response) {
    const user = requireUser(req);
    const count = await notificationService.unreadCount(user.id);
    return ok(res, { count });
  },

  async markRead(req: Request, res: Response) {
    const user = requireUser(req);
    await notificationService.markRead(req.params.id, user.id);
    return ok(res, { success: true });
  },

  async markAllRead(req: Request, res: Response) {
    const user = requireUser(req);
    await notificationService.markAllRead(user.id);
    return ok(res, { success: true });
  },
};
