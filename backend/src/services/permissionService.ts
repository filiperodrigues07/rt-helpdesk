import { permissionRepository } from '../repositories/permissionRepository';
import { tenantPrisma as prisma } from '../utils/tenantPrisma';
import { AppError } from '../utils/AppError';

export const permissionService = {
  async getMatrix() {
    const { roles, permissions } = await permissionRepository.getMatrix();
    return {
      permissions: permissions.map((p) => ({ id: p.id, key: p.key, description: p.description })),
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        permissionKeys: role.permissions.map((p) => p.key),
      })),
    };
  },

  async updateRolePermissions(roleId: string, permissionKeys: string[]) {
    const existing = await prisma.role.findUnique({ where: { id: roleId } });
    if (!existing) {
      throw new AppError('Papel não encontrado', 404);
    }
    if (existing.name === 'ADMINISTRADOR') {
      // Trava de segurança: Administrador sempre tem acesso total, senão
      // ninguém mais conseguiria corrigir as permissões depois.
      throw new AppError('As permissões do Administrador não podem ser alteradas.', 400);
    }

    const role = await permissionRepository.setRolePermissions(roleId, permissionKeys);
    return { id: role.id, name: role.name, permissionKeys: role.permissions.map((p) => p.key) };
  },
};
