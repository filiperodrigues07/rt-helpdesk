import { RoleName } from '@prisma/client';
import { tenantPrisma as prisma } from '../utils/tenantPrisma';

export const permissionRepository = {
  listPermissions() {
    return prisma.permission.findMany({ orderBy: { key: 'asc' } });
  },

  async getMatrix() {
    const [roles, permissions] = await Promise.all([
      prisma.role.findMany({ orderBy: { name: 'asc' }, include: { permissions: true } }),
      prisma.permission.findMany({ orderBy: { key: 'asc' } }),
    ]);
    return { roles, permissions };
  },

  async setRolePermissions(roleId: string, permissionKeys: string[]) {
    const permissions = await prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
    return prisma.role.update({
      where: { id: roleId },
      data: { permissions: { set: permissions.map((p) => ({ id: p.id })) } },
      include: { permissions: true },
    });
  },

  async roleHasPermission(roleName: RoleName, key: string): Promise<boolean> {
    const role = await prisma.role.findFirst({
      where: { name: roleName, permissions: { some: { key } } },
      select: { id: true },
    });
    return !!role;
  },
};
