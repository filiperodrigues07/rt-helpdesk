import { prisma } from '../utils/prisma';

// SuperAdmin não tem tenantId — sempre client global, nunca tenantPrisma.
export const superAdminRepository = {
  findByEmail(email: string) {
    return prisma.superAdmin.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.superAdmin.findUnique({ where: { id } });
  },

  create(data: { name: string; email: string; passwordHash: string }) {
    return prisma.superAdmin.create({ data });
  },
};
