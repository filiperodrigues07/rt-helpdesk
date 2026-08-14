import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);
notificationRoutes.get('/', asyncHandler(notificationController.list));
notificationRoutes.get('/unread-count', asyncHandler(notificationController.unreadCount));
notificationRoutes.post('/:id/read', asyncHandler(notificationController.markRead));
notificationRoutes.post('/read-all', asyncHandler(notificationController.markAllRead));
