import { Router } from 'express';
import { userController } from '../controllers/userController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middlewares/auth';

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.get('/', asyncHandler(userController.list));
userRoutes.post('/', authorize('ADMINISTRADOR', 'GERENTE'), asyncHandler(userController.create));
userRoutes.patch('/:id', authorize('ADMINISTRADOR', 'GERENTE'), asyncHandler(userController.update));
