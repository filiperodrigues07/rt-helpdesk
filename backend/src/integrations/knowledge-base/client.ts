// Camada de integração com a Base de Conhecimento (sistema externo já existente,
// o site "Gestão" em https://gestaoconsultorias.fly.dev). Consome a API
// GET/POST/PATCH/DELETE /api/knowledge-base/articles e GET /categories
// (protegidas por header X-API-Key) desse site — permite listar, buscar,
// visualizar o conteúdo completo, criar, editar e excluir artigos direto
// pelo RT HELPDESK, refletindo no site imediatamente.
//
// Se KNOWLEDGE_BASE_API_URL/KNOWLEDGE_BASE_API_KEY não estiverem configurados,
// cai de volta para os dados mockados abaixo (somente leitura) — mantém o
// ambiente utilizável sem depender do sistema externo estar no ar.

import { env } from '../../utils/env';
import { AppError } from '../../utils/AppError';
import { KnowledgeBaseArticle, KnowledgeBaseArticleInput, KnowledgeBaseCategory } from './types';

const MOCK_ARTICLES: KnowledgeBaseArticle[] = [
  {
    id: 'kb-001',
    title: 'Como corrigir erro ao emitir NFC-e',
    summary: 'Passo a passo para diagnosticar e corrigir falhas comuns na emissão de NFC-e.',
    content: 'Conteúdo de exemplo (dados mockados — configure a integração real para ver artigos de verdade).',
    status: 'published',
    category: 'Fiscal',
    url: 'https://base-de-conhecimento.exemplo.com/artigos/kb-001',
    updatedAt: '2026-06-10T12:00:00.000Z',
  },
  {
    id: 'kb-002',
    title: 'Configuração inicial do módulo de estoque',
    summary: 'Guia de configuração do módulo de estoque para novos clientes.',
    content: 'Conteúdo de exemplo (dados mockados — configure a integração real para ver artigos de verdade).',
    status: 'published',
    category: 'Implantação',
    url: 'https://base-de-conhecimento.exemplo.com/artigos/kb-002',
    updatedAt: '2026-05-22T09:30:00.000Z',
  },
  {
    id: 'kb-003',
    title: 'Erro de comunicação com SEFAZ',
    summary: 'Possíveis causas e soluções para instabilidade na comunicação com a SEFAZ.',
    content: 'Conteúdo de exemplo (dados mockados — configure a integração real para ver artigos de verdade).',
    status: 'published',
    category: 'Fiscal',
    url: 'https://base-de-conhecimento.exemplo.com/artigos/kb-003',
    updatedAt: '2026-07-01T15:45:00.000Z',
  },
  {
    id: 'kb-004',
    title: 'Como resetar senha de acesso ao sistema ERP',
    summary: 'Procedimento padrão para redefinir a senha de um usuário do ERP.',
    content: 'Conteúdo de exemplo (dados mockados — configure a integração real para ver artigos de verdade).',
    status: 'published',
    category: 'Suporte',
    url: 'https://base-de-conhecimento.exemplo.com/artigos/kb-004',
    updatedAt: '2026-04-18T08:00:00.000Z',
  },
];

const MOCK_CATEGORIES: KnowledgeBaseCategory[] = [
  { id: 1, slug: 'fiscal', name: 'Fiscal' },
  { id: 2, slug: 'implantacao', name: 'Implantação' },
  { id: 3, slug: 'suporte', name: 'Suporte' },
];

function isConfigured(): boolean {
  return !!(env.knowledgeBase.apiUrl && env.knowledgeBase.apiKey);
}

async function request<T>(path: string, options: { method?: string; query?: Record<string, string>; body?: unknown } = {}): Promise<T> {
  const url = new URL(path, env.knowledgeBase.apiUrl);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'X-API-Key': env.knowledgeBase.apiKey as string,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 404) {
    return null as T;
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new AppError(body?.error ?? `Erro na API da Base de Conhecimento (HTTP ${response.status})`, 502);
  }

  const body = (await response.json()) as { success: boolean; data: T };
  return body.data;
}

function requireConfigured() {
  if (!isConfigured()) {
    throw new AppError('Integração com a Base de Conhecimento não configurada.', 400);
  }
}

export const knowledgeBaseClient = {
  isConfigured,

  async listArticles(query?: string): Promise<KnowledgeBaseArticle[]> {
    if (!isConfigured()) {
      const lower = query?.trim().toLowerCase();
      if (!lower) return MOCK_ARTICLES;
      return MOCK_ARTICLES.filter(
        (article) => article.title.toLowerCase().includes(lower) || article.summary.toLowerCase().includes(lower),
      );
    }
    return request<KnowledgeBaseArticle[]>('/api/knowledge-base/articles', {
      query: { status: 'all', ...(query ? { q: query } : {}) },
    });
  },

  async getArticleById(id: string): Promise<KnowledgeBaseArticle | null> {
    if (!isConfigured()) return MOCK_ARTICLES.find((article) => article.id === id) ?? null;
    return request<KnowledgeBaseArticle | null>(`/api/knowledge-base/articles/${encodeURIComponent(id)}`);
  },

  listCategories(): Promise<KnowledgeBaseCategory[]> {
    if (!isConfigured()) return Promise.resolve(MOCK_CATEGORIES);
    return request<KnowledgeBaseCategory[]>('/api/knowledge-base/categories');
  },

  createArticle(input: KnowledgeBaseArticleInput): Promise<KnowledgeBaseArticle> {
    requireConfigured();
    return request<KnowledgeBaseArticle>('/api/knowledge-base/articles', { method: 'POST', body: input });
  },

  updateArticle(id: string, input: Partial<KnowledgeBaseArticleInput>): Promise<KnowledgeBaseArticle> {
    requireConfigured();
    return request<KnowledgeBaseArticle>(`/api/knowledge-base/articles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
    });
  },

  async deleteArticle(id: string): Promise<void> {
    requireConfigured();
    await request(`/api/knowledge-base/articles/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
