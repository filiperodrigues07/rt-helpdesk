import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService, type WhatsAppSendTemplateComponent } from '@/services/ticketService';
import type {
  CreateTicketInput,
  ReopenTicketInput,
  ResolveTicketInput,
  TicketStatus,
  UpdateTicketInput,
} from '@/types';

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) => ticketService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTicket(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTicketInput) => ticketService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) => ticketService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useResolveTicket(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ResolveTicketInput) => ticketService.resolve(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCloseTicket(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ticketService.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useReopenTicket(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReopenTicketInput) => ticketService.reopen(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAddComment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => ticketService.addComment(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', id] });
    },
  });
}

export function useUploadAttachment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => ticketService.uploadAttachment(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', id] });
    },
  });
}

export function useSendTicketMessage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { content?: string; files: File[] }) => ticketService.sendMessage(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'conversation', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', id] });
    },
  });
}

export function useUploadTemplateHeaderImage(id: string) {
  return useMutation({
    mutationFn: (file: File) => ticketService.uploadTemplateHeaderImage(id, file),
  });
}

export function useSendWhatsAppTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { templateName: string; language: string; components: WhatsAppSendTemplateComponent[] }) =>
      ticketService.sendWhatsAppTemplate(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'conversation', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', id] });
    },
  });
}
