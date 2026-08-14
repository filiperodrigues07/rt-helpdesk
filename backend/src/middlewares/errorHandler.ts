import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../utils/AppError';
import { fail } from '../utils/apiResponse';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return fail(res, err.status, err.message, err.details);
  }

  if (err instanceof ZodError) {
    return fail(res, 422, 'Dados inválidos', err.flatten());
  }

  if (err instanceof multer.MulterError) {
    return fail(res, 400, err.message);
  }

  console.error('[unhandled error]', err);
  return fail(res, 500, 'Erro interno do servidor');
}

export function notFoundHandler(_req: Request, res: Response) {
  return fail(res, 404, 'Rota não encontrada');
}
