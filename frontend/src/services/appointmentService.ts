import { api } from './api';
import type { ApiSuccess, Appointment, AppointmentInput } from '@/types';

export const appointmentService = {
  async list(params: { start: string; end: string; assigneeId?: string; customerId?: string }) {
    const { data } = await api.get<ApiSuccess<Appointment[]>>('/appointments', { params });
    return data.data;
  },

  async create(input: AppointmentInput) {
    const { data } = await api.post<ApiSuccess<Appointment>>('/appointments', input);
    return data.data;
  },

  async update(id: string, input: Partial<AppointmentInput>) {
    const { data } = await api.patch<ApiSuccess<Appointment>>(`/appointments/${id}`, input);
    return data.data;
  },

  async remove(id: string) {
    await api.delete(`/appointments/${id}`);
  },
};
