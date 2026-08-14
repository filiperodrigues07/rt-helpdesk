import { Request, Response } from 'express';
import { z } from 'zod';
import { reportService } from '../services/reportService';
import { ok } from '../utils/apiResponse';

const PRIORITY_VALUES = ['BAIXA', 'NORMAL', 'ALTA', 'CRITICA'] as const;
const STATUS_VALUES = [
  'NOVO',
  'EM_ANDAMENTO',
  'AGUARDANDO_CLIENTE',
  'AGUARDANDO_TERCEIRO',
  'RESOLVIDO',
  'ENCERRADO',
] as const;

const filtersSchema = z.object({
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  customerId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  status: z.enum(STATUS_VALUES).optional(),
});

export const reportController = {
  async summary(req: Request, res: Response) {
    const filters = filtersSchema.parse(req.query);
    const result = await reportService.summary(filters);
    return ok(res, result);
  },

  async tickets(req: Request, res: Response) {
    const filters = filtersSchema.parse(req.query);
    const result = await reportService.listForExport(filters);
    return ok(res, result);
  },
};
