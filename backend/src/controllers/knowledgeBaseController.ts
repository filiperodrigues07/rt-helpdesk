import { Request, Response } from 'express';
import { knowledgeBaseService } from '../integrations/knowledge-base/service';
import { ok } from '../utils/apiResponse';

export const knowledgeBaseController = {
  async list(req: Request, res: Response) {
    const query = typeof req.query.q === 'string' ? req.query.q : undefined;
    const articles = query
      ? await knowledgeBaseService.searchArticles(query)
      : await knowledgeBaseService.listArticles();
    return ok(res, articles);
  },
};
