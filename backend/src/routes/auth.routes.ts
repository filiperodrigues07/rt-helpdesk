import { Router } from 'express';
import { authController } from '../controllers/authController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenantScope';

export const authRoutes = Router();

authRoutes.post('/login', asyncHandler(authController.login));
authRoutes.get('/me', authenticate, tenantScope, asyncHandler(authController.me));
