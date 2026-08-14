import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';

export const appointmentRoutes = Router();

appointmentRoutes.use(authenticate);
appointmentRoutes.get('/', asyncHandler(appointmentController.list));
appointmentRoutes.post('/', asyncHandler(appointmentController.create));
appointmentRoutes.get('/:id', asyncHandler(appointmentController.getById));
appointmentRoutes.patch('/:id', asyncHandler(appointmentController.update));
appointmentRoutes.delete('/:id', asyncHandler(appointmentController.remove));
