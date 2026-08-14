import { Request, Response } from 'express';
import { z } from 'zod';
import { appointmentService } from '../services/appointmentService';
import { ok, created } from '../utils/apiResponse';

const TYPE_VALUES = [
  'SUPORTE',
  'IMPLANTACAO',
  'TREINAMENTO',
  'REUNIAO',
  'VISITA_TECNICA',
  'RETORNO_CLIENTE',
  'INTERNO',
] as const;

const uuid = z.string().uuid();

const listQuerySchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
  assigneeId: uuid.optional(),
  customerId: uuid.optional(),
});

const appointmentSchema = z
  .object({
    title: z.string().trim().min(2, 'Título é obrigatório'),
    type: z.enum(TYPE_VALUES),
    customerId: uuid.nullable().optional(),
    assigneeId: uuid.nullable().optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    description: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: 'Horário final deve ser depois do horário inicial',
    path: ['endsAt'],
  });

const updateAppointmentSchema = z
  .object({
    title: z.string().trim().min(2).optional(),
    type: z.enum(TYPE_VALUES).optional(),
    customerId: uuid.nullable().optional(),
    assigneeId: uuid.nullable().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    description: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine((data) => !data.startsAt || !data.endsAt || data.endsAt > data.startsAt, {
    message: 'Horário final deve ser depois do horário inicial',
    path: ['endsAt'],
  });

export const appointmentController = {
  async list(req: Request, res: Response) {
    const filters = listQuerySchema.parse(req.query);
    const appointments = await appointmentService.list(filters);
    return ok(res, appointments);
  },

  async getById(req: Request, res: Response) {
    const appointment = await appointmentService.getById(req.params.id);
    return ok(res, appointment);
  },

  async create(req: Request, res: Response) {
    const input = appointmentSchema.parse(req.body);
    const appointment = await appointmentService.create(input);
    return created(res, appointment);
  },

  async update(req: Request, res: Response) {
    const input = updateAppointmentSchema.parse(req.body);
    const appointment = await appointmentService.update(req.params.id, input);
    return ok(res, appointment);
  },

  async remove(req: Request, res: Response) {
    await appointmentService.delete(req.params.id);
    return ok(res, { success: true });
  },
};
