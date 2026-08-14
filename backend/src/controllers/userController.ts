import { Request, Response } from 'express';
import { z } from 'zod';
import { userService } from '../services/userService';
import { ok, created } from '../utils/apiResponse';

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
};
