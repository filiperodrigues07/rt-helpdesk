// Extrai o conteúdo principal de uma página de artigo/blog externo e
// converte pra markdown, pra alimentar o formulário de criação de artigo
// da Base de Conhecimento sem digitação manual. Escrito pra funcionar bem
// com blogs simples (WordPress e afins) — não é um parser universal.

import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { AppError } from '../../utils/AppError';

const CONTENT_SELECTORS = ['article', '.entry-content', '.post-content', 'main'];

// Ruído comum de blog (menu, rodapé, widgets de compartilhamento/relacionados
// do WordPress) que não faz parte do conteúdo do artigo em si.
const NOISE_SELECTORS = [
  'nav',
  'header',
  'footer',
  'script',
  'style',
  'aside',
  'form',
  '.sharedaddy',
  '.jp-relatedposts',
  '.comments',
  '#comments',
  'a[rel="tag"]', // nuvem de tags do WordPress no rodapé do post, não é conteúdo do artigo
];

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

export interface ExtractedArticle {
  title: string;
  markdown: string;
  plainText: string;
  imageUrls: string[];
}

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RTHelpdeskImporter/1.0)' } });
  } catch (error) {
    throw new AppError(`Não foi possível acessar a URL (${error instanceof Error ? error.message : 'erro de rede'})`, 502);
  }

  if (!response.ok) {
    throw new AppError(`A URL respondeu com erro (HTTP ${response.status})`, 502);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('html')) {
    throw new AppError('A URL não retornou uma página HTML', 422);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  function findContentSelector(): string {
    for (const selector of CONTENT_SELECTORS) {
      const match = $(selector).first();
      if (match.length && match.text().trim().length > 50) return selector;
    }
    return 'body';
  }

  const $content = $(findContentSelector()).first();

  // Extrai o título ANTES de remover ruído: o h1 costuma ficar dentro de um
  // <header class="entry-header"> (padrão comum de tema WordPress), que seria
  // removido pelo NOISE_SELECTORS abaixo se a ordem fosse invertida. O h1 é o
  // título de verdade do artigo, mesmo que contenha um traço/travessão no
  // meio (ex.: "Panice – Como instalar certificado...") — nunca cortamos ele.
  const h1Title = $content.find('h1').first().text().trim() || $('h1').first().text().trim();

  // Só o <title> da aba do navegador costuma vir com o nome do site colado
  // no final ("Post – Site") — aí sim faz sentido cortar, mas só o ÚLTIMO
  // segmento (o nome do site), nunca o primeiro traço que aparecer, já que o
  // próprio título do post também pode conter um traço no meio.
  function stripTrailingSiteName(text: string): string {
    const parts = text.split(/\s[–—|-]\s/);
    return parts.length > 1 ? parts.slice(0, -1).join(' – ') : text;
  }
  const fallbackTitle =
    $('meta[property="og:title"]').attr('content')?.trim() || $('title').text().trim() || 'Artigo importado';
  const title = h1Title || stripTrailingSiteName(fallbackTitle).trim();

  // Remove o <h1> (já capturado acima) antes do resto do ruído, pra não
  // duplicar o título — que já vai num campo próprio — no corpo do artigo.
  $content.find('h1').first().remove();

  NOISE_SELECTORS.forEach((selector) => $content.find(selector).remove());

  const imageUrls: string[] = [];
  $content.find('img').each((_, el) => {
    const src = $(el).attr('src');
    if (!src) return;
    try {
      const absolute = new URL(src, url).toString();
      $(el).attr('src', absolute);
      imageUrls.push(absolute);
    } catch {
      // src inválido — ignora essa imagem específica, não interrompe a extração.
    }
  });

  const markdown = turndown.turndown($content.html() ?? '').trim();
  const plainText = $content.text().replace(/\s+/g, ' ').trim();

  if (markdown.length < 10) {
    throw new AppError('Não foi possível encontrar conteúdo de artigo reconhecível nessa URL', 422);
  }

  return { title, markdown, plainText, imageUrls: [...new Set(imageUrls)] };
}
