import { api } from './api';
import type { ApiSuccess, AuthenticatedUser } from '@/types';

export interface TeamMember extends AuthenticatedUser {
  active: boolean;
  createdAt: string;
}

export const userService = {
  async list() {
    const { data } = await api.get<ApiSuccess<TeamMember[]>>('/users');
    return data.data;
  },
};
