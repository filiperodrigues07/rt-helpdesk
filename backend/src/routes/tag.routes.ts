import { Router } from 'express';
import { tagController } from '../controllers/tagController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenantScope';

export const tagRoutes = Router();

tagRoutes.use(authenticate, tenantScope);
tagRoutes.get('/', asyncHandler(tagController.list));
