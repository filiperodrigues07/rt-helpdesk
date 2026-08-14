import { Router } from 'express';
import { settingsController } from '../controllers/settingsController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middlewares/auth';
import { uploadLogo } from '../middlewares/upload';

export const settingsRoutes = Router();

// Pública: a logo precisa aparecer também na tela de login, antes de autenticar.
settingsRoutes.get('/logo', asyncHandler(settingsController.getLogo));

settingsRoutes.post(
  '/logo',
  authenticate,
  authorize('ADMINISTRADOR', 'GERENTE'),
  uploadLogo,
  asyncHandler(settingsController.uploadLogo),
);
settingsRoutes.delete(
  '/logo',
  authenticate,
  authorize('ADMINISTRADOR', 'GERENTE'),
  asyncHandler(settingsController.removeLogo),
);
