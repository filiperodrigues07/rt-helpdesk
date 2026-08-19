import { Request, Response } from 'express';
import { z } from 'zod';
import { superAdminAuthService } from '../services/superAdminAuthService';
import { ok } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const superAdminAuthController = {
  async login(req: Request, res: Response) {
    const { email, password } = loginSchema.parse(req.body);
    const result = await superAdminAuthService.login({ email, password });
    return ok(res, result);
  },

  async me(req: Request, res: Response) {
    if (!req.superAdmin) {
      throw new AppError('Não autenticado', 401);
    }
    const superAdmin = await superAdminAuthService.me(req.superAdmin.superAdminId);
    return ok(res, superAdmin);
  },
};
