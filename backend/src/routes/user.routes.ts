import { Router } from 'express';
import { userController } from '../controllers/userController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middlewares/auth';
import { uploadAvatar } from '../middlewares/upload';

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.get('/', asyncHandler(userController.list));
userRoutes.post('/', authorize('ADMINISTRADOR', 'GERENTE'), asyncHandler(userController.create));
userRoutes.patch('/me', asyncHandler(userController.updateSelf));
userRoutes.post('/me/avatar', uploadAvatar, asyncHandler(userController.uploadAvatar));
userRoutes.patch('/:id', authorize('ADMINISTRADOR', 'GERENTE'), asyncHandler(userController.update));
userRoutes.delete('/:id', authorize('ADMINISTRADOR', 'GERENTE'), asyncHandler(userController.remove));
