import { Request, Response } from 'express';
import { tenantPrisma as prisma } from '../utils/tenantPrisma';
import { ok } from '../utils/apiResponse';

export const roleController = {
  async list(_req: Request, res: Response) {
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
    return ok(res, roles);
  },
};
