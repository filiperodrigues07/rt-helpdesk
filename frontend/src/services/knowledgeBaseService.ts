import { api } from './api';
import type { ApiSuccess } from '@/types';

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  category?: string;
  updatedAt: string;
}

export const knowledgeBaseService = {
  async search(query?: string) {
    const { data } = await api.get<ApiSuccess<KnowledgeBaseArticle[]>>('/knowledge-base', {
      params: query ? { q: query } : undefined,
    });
    return data.data;
  },
};
