import { api } from './api';
import type {
  ApiSuccess,
  CreateTicketInput,
  PaginatedResult,
  ReopenTicketInput,
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
  mediaUrl: string | null;
  timestamp: string | null;
}

// ---- WhatsApp: mensagem livre + templates (Cloud API da Meta, repassado pelo TotalChat) ----

export type WhatsAppTemplateButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';

export interface WhatsAppTemplateButton {
  type: WhatsAppTemplateButtonType;
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[];
}

export interface WhatsAppTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
  text?: string;
  example?: { header_text?: string[]; header_handle?: string[]; body_text?: string[][] };
  buttons?: WhatsAppTemplateButton[];
}

export interface WhatsAppTemplateSummary {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
}

export interface WhatsAppTemplateDetail extends WhatsAppTemplateSummary {
  components: WhatsAppTemplateComponent[];
}

export interface WhatsAppSendTemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'url' | 'quick_reply';
  index?: string;
  parameters: Array<{ type: 'text'; text: string } | { type: 'image'; image: { link: string } }>;
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

  async close(id: string) {
    const { data } = await api.post<ApiSuccess<TicketDetail>>(`/tickets/${id}/close`, {});
    return data.data;
  },

  async reopen(id: string, input: ReopenTicketInput) {
    const { data } = await api.post<ApiSuccess<TicketDetail>>(`/tickets/${id}/reopen`, input);
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

  async sendMessage(id: string, input: { content?: string; files: File[] }) {
    const formData = new FormData();
    if (input.content) formData.append('content', input.content);
    input.files.forEach((file) => formData.append('files', file));
    await api.post(`/tickets/${id}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async listWhatsAppTemplates(id: string, after?: string) {
    const { data } = await api.get<
      ApiSuccess<{ data: WhatsAppTemplateSummary[]; paging?: { cursors?: { after?: string } } }>
    >(`/tickets/${id}/whatsapp-templates`, { params: after ? { after } : undefined });
    return data.data;
  },

  async getWhatsAppTemplate(id: string, templateId: string) {
    const { data } = await api.get<ApiSuccess<WhatsAppTemplateDetail>>(
      `/tickets/${id}/whatsapp-templates/${templateId}`,
    );
    return data.data;
  },

  async uploadTemplateHeaderImage(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<ApiSuccess<{ url: string }>>(
      `/tickets/${id}/whatsapp-template/header-image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data.url;
  },

  async sendWhatsAppTemplate(
    id: string,
    input: { templateName: string; language: string; components: WhatsAppSendTemplateComponent[] },
  ) {
    await api.post(`/tickets/${id}/whatsapp-template`, input);
  },
};
