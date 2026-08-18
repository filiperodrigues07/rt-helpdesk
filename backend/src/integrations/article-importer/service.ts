import { extractArticle } from './extractor';
import { knowledgeBaseService } from '../knowledge-base/service';

const SUMMARY_MAX_LENGTH = 200;

function buildSummary(plainText: string): string {
  if (plainText.length <= SUMMARY_MAX_LENGTH) return plainText;
  const truncated = plainText.slice(0, SUMMARY_MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : SUMMARY_MAX_LENGTH)}…`;
}

function filenameFromUrl(imageUrl: string): string {
  const path = new URL(imageUrl).pathname;
  return path.split('/').pop() || 'imagem.jpg';
}

// Baixa cada imagem do artigo original e re-hospeda no site Gestão (mesmo
// destino usado quando o usuário anexa imagem manualmente no editor), pra
// o artigo importado não depender do site de origem continuar no ar.
async function rehostImages(markdown: string, imageUrls: string[]): Promise<string> {
  let result = markdown;

  for (const imageUrl of imageUrls) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) continue;

      const mimetype = response.headers.get('content-type') ?? 'image/jpeg';
      if (!mimetype.startsWith('image/')) continue;

      const buffer = Buffer.from(await response.arrayBuffer());
      const { url: newUrl } = await knowledgeBaseService.uploadImage({
        buffer,
        originalname: filenameFromUrl(imageUrl),
        mimetype,
      });

      result = result.split(imageUrl).join(newUrl);
    } catch {
      // Falha ao baixar/re-hospedar uma imagem específica não deve derrubar
      // a importação do artigo inteiro — a imagem original (ainda válida
      // por enquanto) fica no markdown como fallback.
    }
  }

  return result;
}

export interface ImportPreviewItem {
  url: string;
  title?: string;
  summary?: string;
  content?: string;
  error?: string;
}

export const articleImporterService = {
  async importArticleFromUrl(url: string): Promise<ImportPreviewItem> {
    try {
      const extracted = await extractArticle(url);
      const content = await rehostImages(extracted.markdown, extracted.imageUrls);

      return {
        url,
        title: extracted.title,
        summary: buildSummary(extracted.plainText),
        content,
      };
    } catch (error) {
      return { url, error: error instanceof Error ? error.message : 'Falha ao importar essa URL' };
    }
  },

  async importArticlesFromUrls(urls: string[]): Promise<ImportPreviewItem[]> {
    return Promise.all(urls.map((url) => this.importArticleFromUrl(url)));
  },
};
