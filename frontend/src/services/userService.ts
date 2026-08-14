import { api } from './api';
import type { ApiSuccess, CreateUserInput, TeamMember, UpdateUserInput } from '@/types';

export const userService = {
  async list() {
    const { data } = await api.get<ApiSuccess<TeamMember[]>>('/users');
    return data.data;
  },

  async create(input: CreateUserInput) {
    const { data } = await api.post<ApiSuccess<TeamMember>>('/users', input);
    return data.data;
  },

  async update(id: string, input: UpdateUserInput) {
    const { data } = await api.patch<ApiSuccess<TeamMember>>(`/users/${id}`, input);
    return data.data;
  },
};
