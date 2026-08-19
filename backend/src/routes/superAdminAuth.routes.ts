import { Router } from 'express';
import { superAdminAuthController } from '../controllers/superAdminAuthController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateSuperAdmin } from '../middlewares/superAdminAuth';

export const superAdminAuthRoutes = Router();

superAdminAuthRoutes.post('/login', asyncHandler(superAdminAuthController.login));
superAdminAuthRoutes.get('/me', authenticateSuperAdmin, asyncHandler(superAdminAuthController.me));
