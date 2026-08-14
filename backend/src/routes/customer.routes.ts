import { Router } from 'express';
import { customerController } from '../controllers/customerController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';

export const customerRoutes = Router();

customerRoutes.use(authenticate);
customerRoutes.get('/', asyncHandler(customerController.list));
customerRoutes.get('/minimal', asyncHandler(customerController.listMinimal));
customerRoutes.post('/', asyncHandler(customerController.create));
customerRoutes.get('/:id', asyncHandler(customerController.getById));
customerRoutes.patch('/:id', asyncHandler(customerController.update));
