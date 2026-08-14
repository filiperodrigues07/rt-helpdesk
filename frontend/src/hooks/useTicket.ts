import { useQuery } from '@tanstack/react-query';
import { ticketService } from '@/services/ticketService';

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: ['tickets', 'detail', id],
    queryFn: () => ticketService.getById(id as string),
    enabled: !!id,
  });
}
