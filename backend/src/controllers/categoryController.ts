import { Request, Response } from 'express';
import { tenantPrisma as prisma } from '../utils/tenantPrisma';
import { ok } from '../utils/apiResponse';

export const categoryController = {
  async list(_req: Request, res: Response) {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return ok(res, categories);
  },
};
