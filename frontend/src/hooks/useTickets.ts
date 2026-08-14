import { useQuery } from '@tanstack/react-query';
import { ticketService } from '@/services/ticketService';
import type { TicketListFilters } from '@/types';

export function useTickets(filters: TicketListFilters) {
  return useQuery({
    queryKey: ['tickets', 'list', filters],
    queryFn: () => ticketService.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useTicketBoard(
  filters: Pick<TicketListFilters, 'priority' | 'assigneeId' | 'customerId' | 'categoryId' | 'search'>,
) {
  return useQuery({
    queryKey: ['tickets', 'board', filters],
    queryFn: () => ticketService.board(filters),
  });
}
