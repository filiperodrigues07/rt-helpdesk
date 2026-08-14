import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { ok } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const authController = {
  async login(req: Request, res: Response) {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login({ email, password });
    return ok(res, result);
  },

  async me(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('Usuário não autenticado', 401);
    }
    const user = await authService.me(req.user.id);
    return ok(res, user);
  },
};