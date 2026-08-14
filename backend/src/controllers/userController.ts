import { Request, Response } from 'express';
import { z } from 'zod';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { ok, created } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Nome é obrigatório'),
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  jobTitle: z.string().trim().optional(),
  roleId: z.string().uuid('Selecione um papel'),
  totalchatAttendantId: z.string().trim().nullable().optional(),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email('E-mail inválido').optional(),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres').optional().or(z.literal('')),
  jobTitle: z.string().trim().optional(),
  roleId: z.string().uuid().optional(),
  active: z.boolean().optional(),
  totalchatAttendantId: z.string().trim().nullable().optional(),
});

const updateSelfSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email('E-mail inválido').optional(),
  jobTitle: z.string().trim().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Nova senha deve ter ao menos 6 caracteres').optional(),
});

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError('Usuário não autenticado', 401);
  }
  return req.user;
}

export const userController = {
  async list(_req: Request, res: Response) {
    const users = await userService.list();
    return ok(res, users);
  },

  async create(req: Request, res: Response) {
    const input = createUserSchema.parse(req.body);
    const user = await userService.create(input);
    return created(res, user);
  },

  async update(req: Request, res: Response) {
    const input = updateUserSchema.parse(req.body);
    const user = await userService.update(req.params.id, {
      ...input,
      password: input.password || undefined,
    });
    return ok(res, user);
  },

  async remove(req: Request, res: Response) {
    const user = requireUser(req);
    await userService.delete(req.params.id, user.id);
    return ok(res, { success: true });
  },

  async updateSelf(req: Request, res: Response) {
    const user = requireUser(req);
    const input = updateSelfSchema.parse(req.body);
    await userService.updateSelf(user.id, input);
    const me = await authService.me(user.id);
    return ok(res, me);
  },

  async uploadAvatar(req: Request, res: Response) {
    const user = requireUser(req);

    if (!req.file) {
      throw new AppError('Nenhum arquivo enviado', 400);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await userService.updateAvatar(user.id, avatarUrl);
    const me = await authService.me(user.id);
    return ok(res, me);
  },
};
