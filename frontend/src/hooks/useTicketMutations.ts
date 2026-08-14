import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService } from '@/services/ticketService';
import type { CreateTicketInput, ResolveTicketInput, TicketStatus, UpdateTicketInput } from '@/types';

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
