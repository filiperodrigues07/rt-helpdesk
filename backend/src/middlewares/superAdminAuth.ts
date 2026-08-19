import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';
import { AppError } from '../utils/AppError';

export interface AuthenticatedSuperAdmin {
  superAdminId: string;
  email: string;
  scope: 'super-admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      superAdmin?: AuthenticatedSuperAdmin;
    }
  }
}

export function authenticateSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Token de autenticação ausente', 401);
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, env.jwtSecret) as Record<string, unknown>;
    if (payload.scope !== 'super-admin') {
      throw new AppError('Token de autenticação inválido ou expirado', 401);
    }
    req.superAdmin = payload as unknown as AuthenticatedSuperAdmin;
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Token de autenticação inválido ou expirado', 401);
  }
}
