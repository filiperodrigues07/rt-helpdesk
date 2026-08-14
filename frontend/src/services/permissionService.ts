import { api } from './api';
import type { ApiSuccess, RoleName } from '@/types';

export interface PermissionInfo {
  id: string;
  key: string;
  description: string | null;
}

export interface RolePermissions {
  id: string;
  name: RoleName;
  permissionKeys: string[];
}

export interface PermissionMatrix {
  permissions: PermissionInfo[];
  roles: RolePermissions[];
}

export const permissionService = {
  async getMatrix() {
    const { data } = await api.get<ApiSuccess<PermissionMatrix>>('/permissions/matrix');
    return data.data;
  },

  async updateRolePermissions(roleId: string, permissionKeys: string[]) {
    const { data } = await api.put<ApiSuccess<RolePermissions>>(`/permissions/roles/${roleId}`, { permissionKeys });
    return data.data;
  },
};
