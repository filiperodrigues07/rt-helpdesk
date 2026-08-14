import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';

export const reportRoutes = Router();

reportRoutes.use(authenticate);
reportRoutes.get('/summary', asyncHandler(reportController.summary));
reportRoutes.get('/tickets', asyncHandler(reportController.tickets));
