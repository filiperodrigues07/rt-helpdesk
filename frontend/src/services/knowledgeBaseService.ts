import { api } from './api';
import type { ApiSuccess } from '@/types';

export type KnowledgeBaseArticleStatus = 'draft' | 'published';

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  status?: KnowledgeBaseArticleStatus;
  categoryId?: number;
  category?: string;
  tags?: string[];
  url: string;
  updatedAt: string;
}

export interface KnowledgeBaseCategory {
  id: number;
  slug: string;
  name: string;
}

export interface KnowledgeBaseArticleInput {
  title: string;
  summary: string;
  content: string;
  categoryId: number;
  status: KnowledgeBaseArticleStatus;
  tags?: string[];
}

export const knowledgeBaseService = {
  async search(query?: string) {
    const { data } = await api.get<ApiSuccess<KnowledgeBaseArticle[]>>('/knowledge-base', {
      params: query ? { q: query } : undefined,
    });
    return data.data;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiSuccess<KnowledgeBaseArticle>>(`/knowledge-base/${encodeURIComponent(id)}`);
    return data.data;
  },

  async listCategories() {
    const { data } = await api.get<ApiSuccess<KnowledgeBaseCategory[]>>('/knowledge-base/categories');
    return data.data;
  },

  async create(input: KnowledgeBaseArticleInput) {
    const { data } = await api.post<ApiSuccess<KnowledgeBaseArticle>>('/knowledge-base', input);
    return data.data;
  },

  async update(id: string, input: Partial<KnowledgeBaseArticleInput>) {
    const { data } = await api.patch<ApiSuccess<KnowledgeBaseArticle>>(`/knowledge-base/${encodeURIComponent(id)}`, input);
    return data.data;
  },

  async remove(id: string) {
    await api.delete<ApiSuccess<{ success: boolean }>>(`/knowledge-base/${encodeURIComponent(id)}`);
  },
};
