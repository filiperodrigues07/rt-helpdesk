import { Request, Response } from 'express';
import { z } from 'zod';
import { TicketStatus } from '@prisma/client';
import { ticketService } from '../services/ticketService';
import { ok, created } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const PRIORITY_VALUES = ['BAIXA', 'NORMAL', 'ALTA', 'CRITICA'] as const;
const STATUS_VALUES = [
  'NOVO',
  'EM_ANDAMENTO',
  'AGUARDANDO_CLIENTE',
  'AGUARDANDO_TERCEIRO',
  'RESOLVIDO',
  'ENCERRADO',
] as const;

const uuid = z.string().uuid();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(STATUS_VALUES).optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  assigneeId: uuid.optional(),
  customerId: uuid.optional(),
  categoryId: uuid.optional(),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'number', 'priority', 'slaDueAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const boardQuerySchema = listQuerySchema.pick({
  priority: true,
  assigneeId: true,
  customerId: true,
  categoryId: true,
  search: true,
});

const createTicketSchema = z.object({
  title: z.string().trim().min(3, 'Título deve ter ao menos 3 caracteres'),
  description: z.string().trim().min(1, 'Descrição é obrigatória'),
  customerId: uuid,
  categoryId: uuid.optional(),
  priority: z.enum(PRIORITY_VALUES),
  assigneeId: uuid.optional(),
  tagIds: z.array(uuid).optional(),
  notifyCustomer: z.boolean().optional(),
});

const updateTicketSchema = z.object({
  title: z.string().trim().min(3).optional(),
  description: z.string().trim().min(1).optional(),
  categoryId: uuid.nullable().optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  assigneeId: uuid.nullable().optional(),
  tagIds: z.array(uuid).optional(),
});

const statusSchema = z.object({
  status: z.enum(STATUS_VALUES),
});

const resolveSchema = z.object({
  resolvedProblem: z.string().trim().min(1, 'Descreva o problema identificado'),
  rootCause: z.string().trim().min(1, 'Descreva a causa raiz'),
  appliedSolution: z.string().trim().min(1, 'Descreva a solução aplicada'),
  observations: z.string().trim().optional(),
});

const reopenSchema = z.object({
  reason: z.string().trim().min(1).optional(),
});

const commentSchema = z.object({
  content: z.string().trim().min(1, 'Comentário não pode ser vazio'),
});

const sendMessageSchema = z.object({
  content: z.string().trim().optional(),
});

const sendTemplateSchema = z.object({
  templateName: z.string().trim().min(1, 'Selecione um template'),
  language: z.string().trim().min(1),
  components: z.array(z.any()),
});

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError('Usuário não autenticado', 401);
  }
  return req.user;
}

export const ticketController = {
  async list(req: Request, res: Response) {
    const query = listQuerySchema.parse(req.query);
    const { page, pageSize, sortBy, sortOrder, ...filters } = query;
    const result = await ticketService.list(filters, { page, pageSize, sortBy, sortOrder });
    return ok(res, result);
  },

  async board(req: Request, res: Response) {
    const filters = boardQuerySchema.parse(req.query);
    const items = await ticketService.board(filters);
    return ok(res, items);
  },

  async getById(req: Request, res: Response) {
    const ticket = await ticketService.getById(req.params.id);
    return ok(res, ticket);
  },

  async getConversation(req: Request, res: Response) {
    const conversation = await ticketService.getConversation(req.params.id);
    return ok(res, conversation);
  },

  async create(req: Request, res: Response) {
    const user = requireUser(req);
    const input = createTicketSchema.parse(req.body);
    const ticket = await ticketService.create({ ...input, creatorId: user.id });
    return created(res, ticket);
  },

  async update(req: Request, res: Response) {
    const user = requireUser(req);
    const input = updateTicketSchema.parse(req.body);
    const ticket = await ticketService.update(req.params.id, input, user.id);
    return ok(res, ticket);
  },

  async updateStatus(req: Request, res: Response) {
    const user = requireUser(req);
    const { status } = statusSchema.parse(req.body);
    const ticket = await ticketService.updateStatus(req.params.id, status as TicketStatus, user.id);
    return ok(res, ticket);
  },

  async resolve(req: Request, res: Response) {
    const user = requireUser(req);
    const input = resolveSchema.parse(req.body);
    const ticket = await ticketService.resolve(req.params.id, input, user.id);
    return ok(res, ticket);
  },

  async close(req: Request, res: Response) {
    const user = requireUser(req);
    const ticket = await ticketService.close(req.params.id, user.id);
    return ok(res, ticket);
  },

  async reopen(req: Request, res: Response) {
    const user = requireUser(req);
    const { reason } = reopenSchema.parse(req.body);
    const ticket = await ticketService.reopen(req.params.id, reason, user.id);
    return ok(res, ticket);
  },

  async addComment(req: Request, res: Response) {
    const user = requireUser(req);
    const { content } = commentSchema.parse(req.body);
    const comment = await ticketService.addComment(req.params.id, user.id, content);
    return created(res, comment);
  },

  async sendMessage(req: Request, res: Response) {
    const user = requireUser(req);
    const { content } = sendMessageSchema.parse(req.body);
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    await ticketService.sendMessage(req.params.id, user.id, {
      content,
      files: files.map((file) => ({ buffer: file.buffer, fileName: file.originalname, mimeType: file.mimetype })),
    });
    return ok(res, { sent: true });
  },

  async listWhatsAppTemplates(req: Request, res: Response) {
    const after = typeof req.query.after === 'string' ? req.query.after : undefined;
    const result = await ticketService.listWhatsAppTemplates(req.params.id, after);
    return ok(res, result);
  },

  async getWhatsAppTemplate(req: Request, res: Response) {
    const template = await ticketService.getWhatsAppTemplate(req.params.id, req.params.templateId);
    return ok(res, template);
  },

  async uploadTemplateHeaderImage(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError('Nenhuma imagem enviada', 400);
    }
    const relativePath = `/uploads/tickets/${req.params.id}/whatsapp-template/${req.file.filename}`;
    const url = await ticketService.uploadTemplateHeaderImage(req.params.id, relativePath);
    return ok(res, { url });
  },

  async sendWhatsAppTemplate(req: Request, res: Response) {
    const user = requireUser(req);
    const input = sendTemplateSchema.parse(req.body);
    await ticketService.sendWhatsAppTemplate(req.params.id, user.id, input);
    return ok(res, { sent: true });
  },

  async addAttachment(req: Request, res: Response) {
    const user = requireUser(req);
    const file = req.file;

    if (!file) {
      throw new AppError('Nenhum arquivo enviado', 400);
    }

    const attachment = await ticketService.addAttachment(
      req.params.id,
      {
        fileName: file.originalname,
        fileUrl: `/uploads/tickets/${req.params.id}/${file.filename}`,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
      user.id,
    );

    return created(res, attachment);
  },
};
