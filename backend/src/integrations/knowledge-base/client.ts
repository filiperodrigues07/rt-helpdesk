// Camada de integração com a Base de Conhecimento (sistema externo já existente,
// o site "Gestão" em https://gestaoconsultorias.fly.dev). Consome o endpoint
// GET /api/knowledge-base/articles (protegido por header X-API-Key) desse site.
//
// Se KNOWLEDGE_BASE_API_URL/KNOWLEDGE_BASE_API_KEY não estiverem configurados,
// cai de volta para os dados mockados abaixo — mantém o ambiente utilizável
// sem depender do sistema externo estar no ar.

import { env } from '../../utils/env';
import { AppError } from '../../utils/AppError';
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

function isConfigured(): boolean {
  return !!(env.knowledgeBase.apiUrl && env.knowledgeBase.apiKey);
}

async function fetchArticles(query?: string): Promise<KnowledgeBaseArticle[]> {
  const url = new URL('/api/knowledge-base/articles', env.knowledgeBase.apiUrl);
  if (query) url.searchParams.set('q', query);

  const response = await fetch(url, {
    headers: { 'X-API-Key': env.knowledgeBase.apiKey as string },
  });

  if (!response.ok) {
    throw new AppError(`Erro na API da Base de Conhecimento (HTTP ${response.status})`, 502);
  }

  const body = (await response.json()) as { success: boolean; data: KnowledgeBaseArticle[] };
  return body.data;
}

export const knowledgeBaseClient = {
  isConfigured,

  async listArticles(): Promise<KnowledgeBaseArticle[]> {
    if (!isConfigured()) return MOCK_ARTICLES;
    return fetchArticles();
  },

  async getArticleById(id: string): Promise<KnowledgeBaseArticle | null> {
    if (!isConfigured()) return MOCK_ARTICLES.find((article) => article.id === id) ?? null;
    const articles = await fetchArticles();
    return articles.find((article) => article.id === id) ?? null;
  },

  async searchArticles(query: string): Promise<KnowledgeBaseArticle[]> {
    const normalized = query.trim();
    if (!isConfigured()) {
      const lower = normalized.toLowerCase();
      if (!lower) return MOCK_ARTICLES;
      return MOCK_ARTICLES.filter(
        (article) =>
          article.title.toLowerCase().includes(lower) || article.summary.toLowerCase().includes(lower),
      );
    }
    return fetchArticles(normalized || undefined);
  },
};
