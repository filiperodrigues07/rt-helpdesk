import { Router } from 'express';
import { userController } from '../controllers/userController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenantScope';
import { requireScreenPermission } from '../middlewares/permission';
import { uploadAvatar } from '../middlewares/upload';

export const userRoutes = Router();

userRoutes.use(authenticate, tenantScope);
// GET / é usado como dropdown de responsável em Chamados/Agenda/Relatórios,
// além da própria tela Equipe — por isso não fica atrás de screen.equipe.
userRoutes.get('/', asyncHandler(userController.list));
userRoutes.patch('/me', asyncHandler(userController.updateSelf));
userRoutes.post('/me/avatar', uploadAvatar, asyncHandler(userController.uploadAvatar));

const canManageTeam = [authorize('ADMINISTRADOR', 'GERENTE'), requireScreenPermission('screen.equipe')];
userRoutes.post('/', ...canManageTeam, asyncHandler(userController.create));
userRoutes.patch('/:id', ...canManageTeam, asyncHandler(userController.update));
userRoutes.delete('/:id', ...canManageTeam, asyncHandler(userController.remove));
