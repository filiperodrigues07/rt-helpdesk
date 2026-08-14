import { Router } from 'express';
import { permissionController } from '../controllers/permissionController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middlewares/auth';

export const permissionRoutes = Router();

permissionRoutes.use(authenticate, authorize('ADMINISTRADOR'));
permissionRoutes.get('/matrix', asyncHandler(permissionController.getMatrix));
permissionRoutes.put('/roles/:roleId', asyncHandler(permissionController.updateRolePermissions));
