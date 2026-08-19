import { Router } from 'express';
import { ticketController } from '../controllers/ticketController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenantScope';
import { requireScreenPermission } from '../middlewares/permission';
import { uploadTicketAttachment, uploadTicketMessageFiles, uploadTemplateHeaderImage } from '../middlewares/upload';

export const ticketRoutes = Router();

ticketRoutes.use(authenticate, tenantScope, requireScreenPermission('screen.chamados'));

ticketRoutes.get('/', asyncHandler(ticketController.list));
ticketRoutes.get('/board', asyncHandler(ticketController.board));
ticketRoutes.post('/', asyncHandler(ticketController.create));
ticketRoutes.get('/:id', asyncHandler(ticketController.getById));
ticketRoutes.get('/:id/conversation', asyncHandler(ticketController.getConversation));
ticketRoutes.patch('/:id', asyncHandler(ticketController.update));
ticketRoutes.patch('/:id/status', asyncHandler(ticketController.updateStatus));
ticketRoutes.post('/:id/resolve', asyncHandler(ticketController.resolve));
ticketRoutes.post('/:id/close', asyncHandler(ticketController.close));
ticketRoutes.post('/:id/reopen', asyncHandler(ticketController.reopen));
ticketRoutes.post('/:id/comments', asyncHandler(ticketController.addComment));
ticketRoutes.post('/:id/attachments', uploadTicketAttachment, asyncHandler(ticketController.addAttachment));
ticketRoutes.post('/:id/messages', uploadTicketMessageFiles, asyncHandler(ticketController.sendMessage));
ticketRoutes.get('/:id/whatsapp-templates', asyncHandler(ticketController.listWhatsAppTemplates));
ticketRoutes.get('/:id/whatsapp-templates/:templateId', asyncHandler(ticketController.getWhatsAppTemplate));
ticketRoutes.post(
  '/:id/whatsapp-template/header-image',
  uploadTemplateHeaderImage,
  asyncHandler(ticketController.uploadTemplateHeaderImage),
);
ticketRoutes.post('/:id/whatsapp-template', asyncHandler(ticketController.sendWhatsAppTemplate));
