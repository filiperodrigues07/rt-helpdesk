import { Router } from 'express';
import { permissionController } from '../controllers/permissionController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenantScope';

export const permissionRoutes = Router();

permissionRoutes.use(authenticate, tenantScope, authorize('ADMINISTRADOR'));
permissionRoutes.get('/matrix', asyncHandler(permissionController.getMatrix));
permissionRoutes.put('/roles/:roleId', asyncHandler(permissionController.updateRolePermissions));
