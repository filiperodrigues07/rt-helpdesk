import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settingsService';

export function useLogo() {
  return useQuery({ queryKey: ['settings', 'logo'], queryFn: settingsService.getLogo });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => settingsService.uploadLogo(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'logo'] }),
  });
}

export function useRemoveLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => settingsService.removeLogo(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'logo'] }),
  });
}
