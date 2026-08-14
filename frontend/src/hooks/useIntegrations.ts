import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { integrationService, type TotalChatConfigInput } from '@/services/integrationService';

export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: integrationService.list,
  });
}

export function useTotalChatConfig(enabled: boolean) {
  return useQuery({
    queryKey: ['integrations', 'totalchat-config'],
    queryFn: integrationService.getTotalChatConfig,
    enabled,
  });
}

export function useUpdateTotalChatConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TotalChatConfigInput) => integrationService.updateTotalChatConfig(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}
