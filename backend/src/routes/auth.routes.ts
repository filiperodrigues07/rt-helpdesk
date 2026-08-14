import { Router } from 'express';
import { authController } from '../controllers/authController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';

export const authRoutes = Router();

authRoutes.post('/login', asyncHandler(authController.login));
authRoutes.get('/me', authenticate, asyncHandler(authController.me));
