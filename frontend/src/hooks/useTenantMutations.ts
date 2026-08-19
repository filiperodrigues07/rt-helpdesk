import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantService } from '@/services/tenantService';
import type { CreateTenantInput } from '@/types';

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenantInput) => tenantService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] }),
  });
}

export function useSetTenantActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => tenantService.setActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] }),
  });
}
