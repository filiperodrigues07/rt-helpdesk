import { useQuery } from '@tanstack/react-query';
import { integrationService } from '@/services/integrationService';

export function useTotalChatAttendants() {
  return useQuery({
    queryKey: ['integrations', 'totalchat', 'attendants'],
    queryFn: integrationService.listTotalChatAttendants,
  });
}
