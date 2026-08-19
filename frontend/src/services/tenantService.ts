import { superAdminApi } from './superAdminApi';
import type { ApiSuccess, CreateTenantInput, CreateTenantResult, TenantListItem } from '@/types';

export const tenantService = {
  async list() {
    const { data } = await superAdminApi.get<ApiSuccess<TenantListItem[]>>('/super-admin/tenants');
    return data.data;
  },

  async create(input: CreateTenantInput) {
    const { data } = await superAdminApi.post<ApiSuccess<CreateTenantResult>>('/super-admin/tenants', input);
    return data.data;
  },

  async setActive(id: string, active: boolean) {
    const { data } = await superAdminApi.patch<ApiSuccess<TenantListItem>>(`/super-admin/tenants/${id}/active`, {
      active,
    });
    return data.data;
  },
};
