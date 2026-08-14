import { Router } from 'express';
import { ticketController } from '../controllers/ticketController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';
import { uploadTicketAttachment } from '../middlewares/upload';

export const ticketRoutes = Router();

ticketRoutes.use(authenticate);

ticketRoutes.get('/', asyncHandler(ticketController.list));
ticketRoutes.get('/board', asyncHandler(ticketController.board));
ticketRoutes.post('/', asyncHandler(ticketController.create));
ticketRoutes.get('/:id', asyncHandler(ticketController.getById));
ticketRoutes.patch('/:id', asyncHandler(ticketController.update));
ticketRoutes.patch('/:id/status', asyncHandler(ticketController.updateStatus));
ticketRoutes.post('/:id/resolve', asyncHandler(ticketController.resolve));
ticketRoutes.post('/:id/comments', asyncHandler(ticketController.addComment));
ticketRoutes.post('/:id/attachments', uploadTicketAttachment, asyncHandler(ticketController.addAttachment));
