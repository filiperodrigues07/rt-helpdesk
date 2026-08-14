import { Router } from 'express';
import { integrationController } from '../controllers/integrationController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middlewares/auth';
import { requireScreenPermission } from '../middlewares/permission';

export const integrationRoutes = Router();

integrationRoutes.use(authenticate);

// Usado pelo formulário de usuário (Equipe) para vincular um atendente do
// TotalChat — por isso não fica atrás de screen.configuracoes.
integrationRoutes.get('/totalchat/attendants', asyncHandler(integrationController.listTotalChatAttendants));

integrationRoutes.use(requireScreenPermission('screen.configuracoes'));
integrationRoutes.get('/', asyncHandler(integrationController.list));
integrationRoutes.post('/totalchat/test', asyncHandler(integrationController.testTotalChat));
integrationRoutes.post('/totalchat/sync', asyncHandler(integrationController.syncTotalChat));
integrationRoutes.get(
  '/totalchat/config',
  authorize('ADMINISTRADOR', 'GERENTE'),
  asyncHandler(integrationController.getTotalChatConfig),
);
integrationRoutes.put(
  '/totalchat/config',
  authorize('ADMINISTRADOR', 'GERENTE'),
  asyncHandler(integrationController.updateTotalChatConfig),
);
