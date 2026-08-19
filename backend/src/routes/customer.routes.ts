import { Router } from 'express';
import { customerController } from '../controllers/customerController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenantScope';
import { requireScreenPermission } from '../middlewares/permission';

export const customerRoutes = Router();

customerRoutes.use(authenticate, tenantScope);
// Usado por dropdowns em outras telas (Chamados, Agenda) — não fica atrás do
// acesso à tela Clientes, senão quebra a criação de chamado/evento pra quem
// não tem essa tela liberada.
customerRoutes.get('/minimal', asyncHandler(customerController.listMinimal));

customerRoutes.use(requireScreenPermission('screen.clientes'));
customerRoutes.get('/', asyncHandler(customerController.list));
customerRoutes.post('/import', asyncHandler(customerController.importBatch));
customerRoutes.post('/', asyncHandler(customerController.create));
customerRoutes.get('/:id', asyncHandler(customerController.getById));
customerRoutes.patch('/:id', asyncHandler(customerController.update));
customerRoutes.delete('/:id', asyncHandler(customerController.remove));
