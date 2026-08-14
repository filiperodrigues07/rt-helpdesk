import { useQuery } from '@tanstack/react-query';
import { ticketService } from '@/services/ticketService';

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: ['tickets', 'detail', id],
    queryFn: () => ticketService.getById(id as string),
    enabled: !!id,
  });
}

export function useTicketConversation(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['tickets', 'conversation', id],
    queryFn: () => ticketService.getConversation(id as string),
    enabled: !!id && enabled,
    staleTime: 60 * 1000,
  });
}
