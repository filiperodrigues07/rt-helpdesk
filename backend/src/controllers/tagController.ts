import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { ok } from '../utils/apiResponse';

export const tagController = {
  async list(_req: Request, res: Response) {
    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
    return ok(res, tags);
  },
};
