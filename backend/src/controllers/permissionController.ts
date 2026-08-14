import { Request, Response } from 'express';
import { z } from 'zod';
import { permissionService } from '../services/permissionService';
import { ok } from '../utils/apiResponse';

const updateSchema = z.object({
  permissionKeys: z.array(z.string()),
});

export const permissionController = {
  async getMatrix(_req: Request, res: Response) {
    const matrix = await permissionService.getMatrix();
    return ok(res, matrix);
  },

  async updateRolePermissions(req: Request, res: Response) {
    const { permissionKeys } = updateSchema.parse(req.body);
    const role = await permissionService.updateRolePermissions(req.params.roleId, permissionKeys);
    return ok(res, role);
  },
};
