import { api } from './api';
import type { ApiSuccess, Role } from '@/types';

export const roleService = {
  async list() {
    const { data } = await api.get<ApiSuccess<Role[]>>('/roles');
    return data.data;
  },
};
