import { Router } from 'express';
import { tagController } from '../controllers/tagController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';

export const tagRoutes = Router();

tagRoutes.use(authenticate);
tagRoutes.get('/', asyncHandler(tagController.list));
