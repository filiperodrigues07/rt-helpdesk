import { Request, Response } from 'express';
import { z } from 'zod';
import { knowledgeBaseService } from '../integrations/knowledge-base/service';
import { articleImporterService } from '../integrations/article-importer/service';
import { ok, created } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const articleInputSchema = z.object({
  title: z.string().trim().min(3, 'Informe um título').max(160),
  summary: z.string().trim().min(5, 'Informe um resumo').max(300),
  content: z.string().trim().min(10, 'O conteúdo é obrigatório'),
  categoryId: z.number().int().positive('Selecione uma categoria'),
  status: z.enum(['draft', 'published']),
  tags: z.array(z.string()).optional(),
});

const updateArticleSchema = articleInputSchema.partial();

const importPreviewSchema = z.object({
  urls: z.array(z.string().trim().url('URL inválida')).min(1, 'Informe ao menos uma URL').max(20, 'Máximo de 20 URLs por vez'),
});

export const knowledgeBaseController = {
  async list(req: Request, res: Response) {
    const query = typeof req.query.q === 'string' ? req.query.q : undefined;
    const articles = await knowledgeBaseService.listArticles(query);
    return ok(res, articles);
  },

  async listCategories(_req: Request, res: Response) {
    const categories = await knowledgeBaseService.listCategories();
    return ok(res, categories);
  },

  async getById(req: Request, res: Response) {
    const article = await knowledgeBaseService.getArticleById(req.params.id);
    if (!article) {
      throw new AppError('Artigo não encontrado', 404);
    }
    return ok(res, article);
  },

  async create(req: Request, res: Response) {
    const input = articleInputSchema.parse(req.body);
    const article = await knowledgeBaseService.createArticle(input);
    return created(res, article);
  },

  async update(req: Request, res: Response) {
    const input = updateArticleSchema.parse(req.body);
    const article = await knowledgeBaseService.updateArticle(req.params.id, input);
    return ok(res, article);
  },

  async remove(req: Request, res: Response) {
    await knowledgeBaseService.deleteArticle(req.params.id);
    return ok(res, { success: true });
  },

  async uploadImage(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError('Nenhuma imagem enviada', 400);
    }
    const result = await knowledgeBaseService.uploadImage({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
    });
    return created(res, result);
  },

  async importPreview(req: Request, res: Response) {
    const { urls } = importPreviewSchema.parse(req.body);
    const results = await articleImporterService.importArticlesFromUrls(urls);
    return ok(res, results);
  },
};
