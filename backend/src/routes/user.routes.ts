import { Router } from 'express';
import { userController } from '../controllers/userController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.get('/', asyncHandler(userController.list));
