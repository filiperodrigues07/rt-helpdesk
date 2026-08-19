import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { tenantContext } from '../utils/tenantContext';

// Roda logo após `authenticate`. Ativa o tenantId da requisição pro resto da
// cadeia (services/repositories que usam utils/tenantPrisma.ts).
export function tenantScope(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw new AppError('Usuário não autenticado', 401);
  }

  tenantContext.run(req.user.tenantId, next);
}
