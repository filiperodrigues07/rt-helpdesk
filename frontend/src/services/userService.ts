import { api } from './api';
import type { ApiSuccess, AuthenticatedUser, CreateUserInput, TeamMember, UpdateUserInput } from '@/types';

export interface UpdateSelfInput {
  name?: string;
  email?: string;
  jobTitle?: string;
  currentPassword?: string;
  newPassword?: string;
}

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

  async remove(id: string) {
    await api.delete(`/users/${id}`);
  },

  async updateSelf(input: UpdateSelfInput) {
    const { data } = await api.patch<ApiSuccess<AuthenticatedUser>>('/users/me', input);
    return data.data;
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<ApiSuccess<AuthenticatedUser>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
};
