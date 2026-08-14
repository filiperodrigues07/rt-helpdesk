import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate);
dashboardRoutes.get('/summary', asyncHandler(dashboardController.summary));
