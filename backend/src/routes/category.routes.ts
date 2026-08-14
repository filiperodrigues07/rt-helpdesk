import { Router } from 'express';
import { categoryController } from '../controllers/categoryController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';

export const categoryRoutes = Router();

categoryRoutes.use(authenticate);
categoryRoutes.get('/', asyncHandler(categoryController.list));
