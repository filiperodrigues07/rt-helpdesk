import { Request, Response } from 'express';
import { tenantPrisma as prisma } from '../utils/tenantPrisma';
import { ok } from '../utils/apiResponse';

export const tagController = {
  async list(_req: Request, res: Response) {
    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
    return ok(res, tags);
  },
};
