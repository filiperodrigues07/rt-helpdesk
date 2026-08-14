import { api } from './api';
import type {
  ApiSuccess,
  CreateTicketInput,
  PaginatedResult,
  ResolveTicketInput,
  TicketComment,
  TicketDetail,
  TicketListFilters,
  TicketListItem,
  TicketStatus,
  UpdateTicketInput,
} from '@/types';

export interface TicketConversationMessage {
  id: number;
  direction: 'cliente' | 'equipe';
  senderName: string;
  text: string;
  mediaType: string | null;
  timestamp: string | null;
}

export const ticketService = {
  async list(filters: TicketListFilters) {
    const { data } = await api.get<ApiSuccess<PaginatedResult<TicketListItem>>>('/tickets', {
      params: filters,
    });
    return data.data;
  },

  async board(filters: Pick<TicketListFilters, 'priority' | 'assigneeId' | 'customerId' | 'categoryId' | 'search'>) {
    const { data } = await api.get<ApiSuccess<TicketListItem[]>>('/tickets/board', { params: filters });
    return data.data;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiSuccess<TicketDetail>>(`/tickets/${id}`);
    return data.data;
  },

  async getConversation(id: string) {
    const { data } = await api.get<ApiSuccess<TicketConversationMessage[]>>(`/tickets/${id}/conversation`);
    return data.data;
  },

  async create(input: CreateTicketInput) {
    const { data } = await api.post<ApiSuccess<TicketDetail>>('/tickets', input);
    return data.data;
  },

  async update(id: string, input: UpdateTicketInput) {
    const { data } = await api.patch<ApiSuccess<TicketDetail>>(`/tickets/${id}`, input);
    return data.data;
  },

  async updateStatus(id: string, status: TicketStatus) {
    const { data } = await api.patch<ApiSuccess<TicketDetail>>(`/tickets/${id}/status`, { status });
    return data.data;
  },

  async resolve(id: string, input: ResolveTicketInput) {
    const { data } = await api.post<ApiSuccess<TicketDetail>>(`/tickets/${id}/resolve`, input);
    return data.data;
  },

  async addComment(id: string, content: string) {
    const { data } = await api.post<ApiSuccess<TicketComment>>(`/tickets/${id}/comments`, { content });
    return data.data;
  },

  async uploadAttachment(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/tickets/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
};
