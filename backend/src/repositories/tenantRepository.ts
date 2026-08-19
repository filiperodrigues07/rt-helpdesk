import { prisma } from '../utils/prisma';

// Tenant nunca é tenant-scoped (é a própria unidade de escopo) — client global.
export const tenantRepository = {
  list() {
    return prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  },

  findBySlug(slug: string) {
    return prisma.tenant.findUnique({ where: { slug } });
  },

  findById(id: string) {
    return prisma.tenant.findUnique({ where: { id } });
  },

  updateActive(id: string, active: boolean) {
    return prisma.tenant.update({ where: { id }, data: { active } });
  },
};
