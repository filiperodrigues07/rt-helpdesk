import { Router } from 'express';
import { knowledgeBaseController } from '../controllers/knowledgeBaseController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middlewares/auth';
import { requireScreenPermission } from '../middlewares/permission';
import { uploadArticleImage } from '../middlewares/upload';

export const knowledgeBaseRoutes = Router();

knowledgeBaseRoutes.use(authenticate);
// Leitura fica aberta pra qualquer autenticado: o widget de artigos
// relacionados dentro do Chamado usa esses mesmos endpoints, independente
// da tela Base de Conhecimento estar liberada pro papel do usuário.
knowledgeBaseRoutes.get('/', asyncHandler(knowledgeBaseController.list));
knowledgeBaseRoutes.get('/categories', asyncHandler(knowledgeBaseController.listCategories));
knowledgeBaseRoutes.get('/:id', asyncHandler(knowledgeBaseController.getById));

const canManageArticles = [authorize('ADMINISTRADOR', 'GERENTE'), requireScreenPermission('screen.base-conhecimento')];
knowledgeBaseRoutes.post('/', ...canManageArticles, asyncHandler(knowledgeBaseController.create));
knowledgeBaseRoutes.patch('/:id', ...canManageArticles, asyncHandler(knowledgeBaseController.update));
knowledgeBaseRoutes.delete('/:id', ...canManageArticles, asyncHandler(knowledgeBaseController.remove));
knowledgeBaseRoutes.post(
  '/images',
  ...canManageArticles,
  uploadArticleImage,
  asyncHandler(knowledgeBaseController.uploadImage),
);
knowledgeBaseRoutes.post('/import/preview', ...canManageArticles, asyncHandler(knowledgeBaseController.importPreview));
