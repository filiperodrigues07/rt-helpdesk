import { Router } from 'express';
import { roleController } from '../controllers/roleController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenantScope';

export const roleRoutes = Router();

roleRoutes.use(authenticate, tenantScope);
roleRoutes.get('/', asyncHandler(roleController.list));
