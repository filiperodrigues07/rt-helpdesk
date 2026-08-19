import { superAdminApi } from './superAdminApi';
import type { ApiSuccess, SuperAdminLoginResponse, SuperAdminUser } from '@/types';

export const superAdminAuthService = {
  async login(email: string, password: string) {
    const { data } = await superAdminApi.post<ApiSuccess<SuperAdminLoginResponse>>('/super-admin/auth/login', {
      email,
      password,
    });
    return data.data;
  },

  async me() {
    const { data } = await superAdminApi.get<ApiSuccess<SuperAdminUser>>('/super-admin/auth/me');
    return data.data;
  },
};
