import { Router } from 'express';
import { knowledgeBaseController } from '../controllers/knowledgeBaseController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middlewares/auth';

export const knowledgeBaseRoutes = Router();

knowledgeBaseRoutes.use(authenticate);
knowledgeBaseRoutes.get('/', asyncHandler(knowledgeBaseController.list));
knowledgeBaseRoutes.get('/categories', asyncHandler(knowledgeBaseController.listCategories));
knowledgeBaseRoutes.post('/', authorize('ADMINISTRADOR', 'GERENTE'), asyncHandler(knowledgeBaseController.create));
knowledgeBaseRoutes.get('/:id', asyncHandler(knowledgeBaseController.getById));
knowledgeBaseRoutes.patch('/:id', authorize('ADMINISTRADOR', 'GERENTE'), asyncHandler(knowledgeBaseController.update));
knowledgeBaseRoutes.delete('/:id', authorize('ADMINISTRADOR', 'GERENTE'), asyncHandler(knowledgeBaseController.remove));
