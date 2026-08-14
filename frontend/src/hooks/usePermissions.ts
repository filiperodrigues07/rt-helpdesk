import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { permissionService } from '@/services/permissionService';

export function usePermissionMatrix(enabled: boolean) {
  return useQuery({
    queryKey: ['permissions', 'matrix'],
    queryFn: permissionService.getMatrix,
    enabled,
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionKeys }: { roleId: string; permissionKeys: string[] }) =>
      permissionService.updateRolePermissions(roleId, permissionKeys),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
}
