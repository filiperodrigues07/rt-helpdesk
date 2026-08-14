import { api } from './api';
import type { ApiSuccess, IntegrationInfo } from '@/types';

export interface TotalChatSyncResult {
  skipped: boolean;
  reason?: string;
  processedContacts?: number;
  results?: { clienteId: number; action: 'created' | 'updated' | 'error'; ticketId?: string; error?: string }[];
}

export const integrationService = {
  async list() {
    const { data } = await api.get<ApiSuccess<IntegrationInfo[]>>('/integrations');
    return data.data;
  },

  async testTotalChat() {
    const { data } = await api.post<ApiSuccess<{ configured: boolean }>>('/integrations/totalchat/test');
    return data.data;
  },

  async syncTotalChat() {
    const { data } = await api.post<ApiSuccess<TotalChatSyncResult>>('/integrations/totalchat/sync');
    return data.data;
  },
};
