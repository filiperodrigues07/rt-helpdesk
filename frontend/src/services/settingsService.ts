import { api } from './api';
import type { ApiSuccess } from '@/types';

export const settingsService = {
  async getLogo() {
    const { data } = await api.get<ApiSuccess<{ url: string | null }>>('/settings/logo');
    return data.data.url;
  },

  async uploadLogo(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<ApiSuccess<{ url: string | null }>>('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.url;
  },

  async removeLogo() {
    await api.delete('/settings/logo');
  },
};
