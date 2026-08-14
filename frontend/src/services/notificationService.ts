import { api } from './api';
import type { ApiSuccess, AppNotification } from '@/types';

export const notificationService = {
  async list(unreadOnly = false) {
    const { data } = await api.get<ApiSuccess<AppNotification[]>>('/notifications', {
      params: unreadOnly ? { unreadOnly: 'true' } : undefined,
    });
    return data.data;
  },

  async unreadCount() {
    const { data } = await api.get<ApiSuccess<{ count: number }>>('/notifications/unread-count');
    return data.data.count;
  },

  async markRead(id: string) {
    await api.post(`/notifications/${id}/read`);
  },

  async markAllRead() {
    await api.post('/notifications/read-all');
  },
};
