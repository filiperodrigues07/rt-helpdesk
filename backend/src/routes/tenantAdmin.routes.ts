import { Router } from 'express';
import { tenantAdminController } from '../controllers/tenantAdminController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateSuperAdmin } from '../middlewares/superAdminAuth';

export const tenantAdminRoutes = Router();

tenantAdminRoutes.use(authenticateSuperAdmin);

tenantAdminRoutes.get('/', asyncHandler(tenantAdminController.list));
tenantAdminRoutes.post('/', asyncHandler(tenantAdminController.create));
tenantAdminRoutes.patch('/:id/active', asyncHandler(tenantAdminController.setActive));
