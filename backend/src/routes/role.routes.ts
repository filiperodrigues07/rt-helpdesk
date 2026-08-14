import { Router } from 'express';
import { roleController } from '../controllers/roleController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';

export const roleRoutes = Router();

roleRoutes.use(authenticate);
roleRoutes.get('/', asyncHandler(roleController.list));
