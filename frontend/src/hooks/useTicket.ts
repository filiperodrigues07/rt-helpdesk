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

export function useWhatsAppTemplates(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['tickets', 'whatsapp-templates', id],
    queryFn: () => ticketService.listWhatsAppTemplates(id),
    enabled: !!id && enabled,
  });
}

export function useWhatsAppTemplate(id: string, templateId: string | undefined) {
  return useQuery({
    queryKey: ['tickets', 'whatsapp-template', id, templateId],
    queryFn: () => ticketService.getWhatsAppTemplate(id, templateId as string),
    enabled: !!id && !!templateId,
  });
}
