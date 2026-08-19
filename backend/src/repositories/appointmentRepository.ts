import { Prisma } from '@prisma/client';
import { tenantPrisma as prisma } from '../utils/tenantPrisma';

export interface AppointmentListFilters {
  start: Date;
  end: Date;
  assigneeId?: string;
  customerId?: string;
}

const include = {
  customer: { select: { id: true, companyName: true, tradeName: true } },
  assignee: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.AppointmentInclude;

export const appointmentRepository = {
  list(filters: AppointmentListFilters) {
    const where: Prisma.AppointmentWhereInput = {
      startsAt: { lt: filters.end },
      endsAt: { gt: filters.start },
      ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
    };

    return prisma.appointment.findMany({ where, include, orderBy: { startsAt: 'asc' } });
  },

  findById(id: string) {
    return prisma.appointment.findUnique({ where: { id }, include });
  },

  create(data: Prisma.AppointmentCreateInput) {
    return prisma.appointment.create({ data, include });
  },

  update(id: string, data: Prisma.AppointmentUpdateInput) {
    return prisma.appointment.update({ where: { id }, data, include });
  },

  delete(id: string) {
    return prisma.appointment.delete({ where: { id } });
  },
};
