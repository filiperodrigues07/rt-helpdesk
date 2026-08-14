import { AppointmentType } from '@prisma/client';
import { appointmentRepository, AppointmentListFilters } from '../repositories/appointmentRepository';
import { AppError } from '../utils/AppError';

interface AppointmentInput {
  title: string;
  type: AppointmentType;
  customerId?: string | null;
  assigneeId?: string | null;
  startsAt: Date;
  endsAt: Date;
  description?: string | null;
  notes?: string | null;
}

export const appointmentService = {
  list(filters: AppointmentListFilters) {
    return appointmentRepository.list(filters);
  },

  async getById(id: string) {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      throw new AppError('Evento não encontrado', 404);
    }
    return appointment;
  },

  create(input: AppointmentInput) {
    return appointmentRepository.create({
      title: input.title,
      type: input.type,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      description: input.description,
      notes: input.notes,
      customer: input.customerId ? { connect: { id: input.customerId } } : undefined,
      assignee: input.assigneeId ? { connect: { id: input.assigneeId } } : undefined,
    });
  },

  async update(id: string, input: Partial<AppointmentInput>) {
    await this.getById(id);
    return appointmentRepository.update(id, {
      title: input.title,
      type: input.type,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      description: input.description,
      notes: input.notes,
      customer:
        input.customerId === undefined
          ? undefined
          : input.customerId
            ? { connect: { id: input.customerId } }
            : { disconnect: true },
      assignee:
        input.assigneeId === undefined
          ? undefined
          : input.assigneeId
            ? { connect: { id: input.assigneeId } }
            : { disconnect: true },
    });
  },

  async delete(id: string) {
    await this.getById(id);
    await appointmentRepository.delete(id);
  },
};
