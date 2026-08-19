import { Request, Response } from 'express';
import { z } from 'zod';
import { tenantAdminService } from '../services/tenantAdminService';
import { ok, created } from '../utils/apiResponse';

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const createSchema = z.object({
  tenantName: z.string().trim().min(1, 'Nome da empresa é obrigatório'),
  tenantSlug: z
    .string()
    .trim()
    .min(1, 'Slug é obrigatório')
    .regex(SLUG_REGEX, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  adminName: z.string().trim().min(1, 'Nome do administrador é obrigatório'),
  adminEmail: z.string().trim().email('E-mail inválido'),
  adminPassword: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});

const setActiveSchema = z.object({
  active: z.boolean(),
});

export const tenantAdminController = {
  async list(_req: Request, res: Response) {
    const tenants = await tenantAdminService.list();
    return ok(res, tenants);
  },

  async create(req: Request, res: Response) {
    const input = createSchema.parse(req.body);
    const result = await tenantAdminService.create(input);
    return created(res, result);
  },

  async setActive(req: Request, res: Response) {
    const { active } = setActiveSchema.parse(req.body);
    const tenant = await tenantAdminService.setActive(req.params.id, active);
    return ok(res, tenant);
  },
};
