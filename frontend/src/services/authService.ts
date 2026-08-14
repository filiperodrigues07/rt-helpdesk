import { api } from './api';
import type { ApiSuccess, AuthenticatedUser, LoginResponse } from '@/types';

export const authService = {
  async login(email: string, password: string) {
    const { data } = await api.post<ApiSuccess<LoginResponse>>('/auth/login', { email, password });
    return data.data;
  },

  async me() {
    const { data } = await api.get<ApiSuccess<AuthenticatedUser>>('/auth/me');
    return data.data;
  },
};
