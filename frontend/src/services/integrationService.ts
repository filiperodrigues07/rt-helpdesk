import { api } from './api';
import type { ApiSuccess, IntegrationInfo, TotalChatAttendant } from '@/types';

export interface TotalChatSyncResult {
  skipped: boolean;
  reason?: string;
  processedContacts?: number;
  results?: {
    clienteId: number;
    action: 'created' | 'updated' | 'skipped' | 'error';
    ticketId?: string;
    error?: string;
  }[];
}

export interface TotalChatConfig {
  apiUrl: string;
  username: string;
  hasPassword: boolean;
  connectionId: number | null;
  whatsappCloudApiFid: number | null;
  pollingEnabled: boolean;
  pollIntervalSeconds: number;
}

export interface TotalChatConfigInput {
  apiUrl?: string;
  username?: string;
  password?: string;
  connectionId?: number | null;
  whatsappCloudApiFid?: number | null;
  pollingEnabled?: boolean;
  pollIntervalSeconds?: number;
}

export interface TotalChatWhatsAppSource {
  id: number;
  nome: string;
  telefone: string;
  wabaId: string;
}

export interface ChErpConfig {
  baseUrl: string;
  hasToken: boolean;
  cnpjPrincipal: string;
  chaveEmpresa: number;
}

export interface ChErpConfigInput {
  baseUrl?: string;
  token?: string;
  cnpjPrincipal?: string;
  chaveEmpresa?: number;
}

export interface ChErpSyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
}

export const integrationService = {
  async list() {
    const { data } = await api.get<ApiSuccess<IntegrationInfo[]>>('/integrations');
    return data.data;
  },

  async getTotalChatConfig() {
    const { data } = await api.get<ApiSuccess<TotalChatConfig>>('/integrations/totalchat/config');
    return data.data;
  },

  async updateTotalChatConfig(input: TotalChatConfigInput) {
    const { data } = await api.put<ApiSuccess<TotalChatConfig>>('/integrations/totalchat/config', input);
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

  async listTotalChatAttendants() {
    const { data } = await api.get<ApiSuccess<TotalChatAttendant[]>>('/integrations/totalchat/attendants');
    return data.data;
  },

  async listWhatsAppSources() {
    const { data } = await api.get<ApiSuccess<TotalChatWhatsAppSource[]>>('/integrations/totalchat/whatsapp-sources');
    return data.data;
  },

  async getChErpConfig() {
    const { data } = await api.get<ApiSuccess<ChErpConfig>>('/integrations/ch-erp/config');
    return data.data;
  },

  async updateChErpConfig(input: ChErpConfigInput) {
    const { data } = await api.put<ApiSuccess<ChErpConfig>>('/integrations/ch-erp/config', input);
    return data.data;
  },

  async testChErp() {
    const { data } = await api.post<ApiSuccess<{ configured: boolean }>>('/integrations/ch-erp/test');
    return data.data;
  },

  async syncChErp() {
    const { data } = await api.post<ApiSuccess<ChErpSyncResult>>('/integrations/ch-erp/sync');
    return data.data;
  },
};
