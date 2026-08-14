import { NextFunction, Request, Response } from 'express';
import { permissionRepository } from '../repositories/permissionRepository';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

// Controla acesso por tela (configurável em Configurações → Permissões).
// ADMINISTRADOR sempre passa — trava de segurança pra nunca ficar sem
// ninguém conseguindo acessar a tela de Permissões e corrigir um engano.
//
// Precisa passar por asyncHandler: um `throw` dentro de um middleware async
// não é capturado pelo Express automaticamente (vira unhandled rejection e
// derruba o processo) — só funciona em middlewares síncronos. E como é
// middleware (não handler terminal), tem que chamar next() explicitamente.
export function requireScreenPermission(key: string) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Usuário não autenticado', 401);
    }
    if (req.user.role === 'ADMINISTRADOR') {
      return next();
    }

    const hasPermission = await permissionRepository.roleHasPermission(req.user.role, key);
    if (!hasPermission) {
      throw new AppError('Você não tem permissão para acessar esta tela', 403);
    }

    next();
  });
}
