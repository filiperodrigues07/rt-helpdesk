import { knowledgeBaseClient } from './client';

export const knowledgeBaseService = {
  async getIntegrationStatus() {
    return {
      provider: 'KNOWLEDGE_BASE' as const,
      status: knowledgeBaseClient.isConfigured() ? 'CONECTADO' : 'AGUARDANDO_CONFIGURACAO',
    };
  },

  listArticles() {
    return knowledgeBaseClient.listArticles();
  },

  getArticleById(id: string) {
    return knowledgeBaseClient.getArticleById(id);
  },

  searchArticles(query: string) {
    return knowledgeBaseClient.searchArticles(query);
  },
};
