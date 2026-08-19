import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenantScope';

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate, tenantScope);
dashboardRoutes.get('/summary', asyncHandler(dashboardController.summary));
