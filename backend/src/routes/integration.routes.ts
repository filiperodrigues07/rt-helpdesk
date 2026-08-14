import { Router } from 'express';
import { integrationController } from '../controllers/integrationController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';

export const integrationRoutes = Router();

integrationRoutes.use(authenticate);
integrationRoutes.get('/', asyncHandler(integrationController.list));
integrationRoutes.post('/totalchat/test', asyncHandler(integrationController.testTotalChat));
integrationRoutes.post('/totalchat/sync', asyncHandler(integrationController.syncTotalChat));
