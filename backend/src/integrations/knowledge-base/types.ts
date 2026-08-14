// Estrutura de consumo da API real da Base de Conhecimento (site Gestão,
// https://gestaoconsultorias.fly.dev/api/knowledge-base/*), autenticada via
// header X-API-Key (env KNOWLEDGE_BASE_API_URL / KNOWLEDGE_BASE_API_KEY).

export type KnowledgeBaseArticleStatus = 'draft' | 'published';

export interface KnowledgeBaseArticle {
  id: string; // slug do artigo no site Gestão
  title: string;
  summary: string;
  content?: string; // presente na busca por id/detalhe; ausente na listagem
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
