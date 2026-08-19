import { Router } from 'express';
import { categoryController } from '../controllers/categoryController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenantScope';

export const categoryRoutes = Router();

categoryRoutes.use(authenticate, tenantScope);
categoryRoutes.get('/', asyncHandler(categoryController.list));
