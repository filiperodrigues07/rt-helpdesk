import { Request, Response } from 'express';
import { z } from 'zod';
import { customerService } from '../services/customerService';
import { ok, created } from '../utils/apiResponse';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().min(1).optional(),
});

const customerSchema = z.object({
  companyName: z.string().trim().min(2, 'Razão social é obrigatória'),
  tradeName: z.string().trim().optional(),
  cnpj: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .refine((value) => value === '' || value.length === 14, 'CNPJ deve ter 14 dígitos')
    .optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('E-mail inválido').optional().or(z.literal('')),
  city: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const updateCustomerSchema = customerSchema.partial();

function sanitize<T extends Record<string, unknown>>(input: T) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    result[key] = value === '' ? undefined : value;
  }
  return result;
}

export const customerController = {
  async list(req: Request, res: Response) {
    const { page, pageSize, search } = listQuerySchema.parse(req.query);
    const result = await customerService.list({ search }, { page, pageSize });
    return ok(res, result);
  },

  async listMinimal(_req: Request, res: Response) {
    const customers = await customerService.listMinimal();
    return ok(res, customers);
  },

  async getById(req: Request, res: Response) {
    const customer = await customerService.getById(req.params.id);
    return ok(res, customer);
  },

  async create(req: Request, res: Response) {
    const input = customerSchema.parse(req.body);
    const customer = await customerService.create(sanitize(input) as typeof input);
    return created(res, customer);
  },

  async update(req: Request, res: Response) {
    const input = updateCustomerSchema.parse(req.body);
    const customer = await customerService.update(req.params.id, sanitize(input));
    return ok(res, customer);
  },
};
