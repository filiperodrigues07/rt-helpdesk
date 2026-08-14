import { useQuery } from '@tanstack/react-query';
import { integrationService } from '@/services/integrationService';

export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: integrationService.list,
  });
}
