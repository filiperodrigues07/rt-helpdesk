import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointmentService';
import type { AppointmentInput } from '@/types';

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AppointmentInput) => appointmentService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AppointmentInput> }) =>
      appointmentService.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
}
