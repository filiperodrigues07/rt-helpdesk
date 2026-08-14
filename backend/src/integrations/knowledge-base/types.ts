// Estrutura preparada para consumo futuro da API da Base de Conhecimento
// (sistema já existente, mantido fora do RT HELPDESK).
//
// Os endpoints abaixo (GET /api/articles, GET /api/articles/:id,
// GET /api/articles/search?q=) são apenas exemplos de arquitetura interna.
// NÃO assumir que serão exatamente esses endpoints na API real.

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  category?: string;
  updatedAt: string;
}
