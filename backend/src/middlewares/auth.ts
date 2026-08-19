import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { RoleName } from '@prisma/client';
import { env } from '../utils/env';
import { AppError } from '../utils/AppError';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: RoleName;
  tenantId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Token de autenticação ausente', 401);
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthenticatedUser & { scope?: string };
    // Defesa em profundidade: um token do realm de super admin nunca deve ser
    // aceito aqui — payload.tenantId viria undefined e quebraria tenantScope.
    if (payload.scope === 'super-admin') {
      throw new AppError('Token de autenticação inválido ou expirado', 401);
    }
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Token de autenticação inválido ou expirado', 401);
  }
}

export function authorize(...allowedRoles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      throw new AppError('Você não tem permissão para executar esta ação', 403);
    }

    next();
  };
}
