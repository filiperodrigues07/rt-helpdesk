import { Router } from 'express';
import { knowledgeBaseController } from '../controllers/knowledgeBaseController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';

export const knowledgeBaseRoutes = Router();

knowledgeBaseRoutes.use(authenticate);
knowledgeBaseRoutes.get('/', asyncHandler(knowledgeBaseController.list));
