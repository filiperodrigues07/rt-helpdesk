import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointmentService';

export function useAppointments(range: { start: string; end: string } | null) {
  return useQuery({
    queryKey: ['appointments', range],
    queryFn: () => appointmentService.list(range as { start: string; end: string }),
    enabled: !!range,
  });
}
