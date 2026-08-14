// Camada de integração com a Base de Conhecimento (sistema externo já existente).
//
// A API real ainda não foi disponibilizada. Enquanto isso, este client expõe
// os mesmos métodos que a integração real terá, mas retorna dados mockados
// mantidos localmente. Quando a API real estiver disponível, substituir a
// implementação abaixo por chamadas HTTP reais — a interface pública
// (métodos e tipos de retorno) deve permanecer a mesma para não impactar
// quem consome este client.

import { KnowledgeBaseArticle } from './types';

const MOCK_ARTICLES: KnowledgeBaseArticle[] = [
  {
    id: 'kb-001',
    title: 'Como corrigir erro ao emitir NFC-e',
    summary: 'Passo a passo para diagnosticar e corrigir falhas comuns na emissão de NFC-e.',
    url: 'https://base-de-conhecimento.exemplo.com/artigos/kb-001',
    category: 'Fiscal',
    updatedAt: '2026-06-10T12:00:00.000Z',
  },
  {
    id: 'kb-002',
    title: 'Configuração inicial do módulo de estoque',
    summary: 'Guia de configuração do módulo de estoque para novos clientes.',
    url: 'https://base-de-conhecimento.exemplo.com/artigos/kb-002',
    category: 'Implantação',
    updatedAt: '2026-05-22T09:30:00.000Z',
  },
  {
    id: 'kb-003',
    title: 'Erro de comunicação com SEFAZ',
    summary: 'Possíveis causas e soluções para instabilidade na comunicação com a SEFAZ.',
    url: 'https://base-de-conhecimento.exemplo.com/artigos/kb-003',
    category: 'Fiscal',
    updatedAt: '2026-07-01T15:45:00.000Z',
  },
  {
    id: 'kb-004',
    title: 'Como resetar senha de acesso ao sistema ERP',
    summary: 'Procedimento padrão para redefinir a senha de um usuário do ERP.',
    url: 'https://base-de-conhecimento.exemplo.com/artigos/kb-004',
    category: 'Suporte',
    updatedAt: '2026-04-18T08:00:00.000Z',
  },
];

export const knowledgeBaseClient = {
  isConfigured(): boolean {
    // TODO: retornar true quando a URL/token da API real forem configurados.
    return false;
  },

  async listArticles(): Promise<KnowledgeBaseArticle[]> {
    // TODO: substituir por GET /api/articles na API real.
    return MOCK_ARTICLES;
  },

  async getArticleById(id: string): Promise<KnowledgeBaseArticle | null> {
    // TODO: substituir por GET /api/articles/:id na API real.
    return MOCK_ARTICLES.find((article) => article.id === id) ?? null;
  },

  async searchArticles(query: string): Promise<KnowledgeBaseArticle[]> {
    // TODO: substituir por GET /api/articles/search?q= na API real.
    const normalized = query.trim().toLowerCase();
    if (!normalized) return MOCK_ARTICLES;

    return MOCK_ARTICLES.filter(
      (article) =>
        article.title.toLowerCase().includes(normalized) ||
        article.summary.toLowerCase().includes(normalized),
    );
  },
};
