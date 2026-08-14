import { knowledgeBaseClient } from './client';
import { KnowledgeBaseArticleInput } from './types';

export const knowledgeBaseService = {
  async getIntegrationStatus() {
    return {
      provider: 'KNOWLEDGE_BASE' as const,
      status: knowledgeBaseClient.isConfigured() ? 'CONECTADO' : 'AGUARDANDO_CONFIGURACAO',
    };
  },

  listArticles(query?: string) {
    return knowledgeBaseClient.listArticles(query);
  },

  getArticleById(id: string) {
    return knowledgeBaseClient.getArticleById(id);
  },

  listCategories() {
    return knowledgeBaseClient.listCategories();
  },

  createArticle(input: KnowledgeBaseArticleInput) {
    return knowledgeBaseClient.createArticle(input);
  },

  updateArticle(id: string, input: Partial<KnowledgeBaseArticleInput>) {
    return knowledgeBaseClient.updateArticle(id, input);
  },

  deleteArticle(id: string) {
    return knowledgeBaseClient.deleteArticle(id);
  },
};
