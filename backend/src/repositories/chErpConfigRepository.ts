import { prisma } from '../utils/prisma';

// Configuração é uma linha única (singleton) — sempre a mais recente criada.
async function getRow() {
  return prisma.chErpConfig.findFirst({ orderBy: { createdAt: 'asc' } });
}

export const chErpConfigRepository = {
  get: getRow,

  async upsert(data: {
    baseUrl?: string | null;
    token?: string | null;
    cnpjPrincipal?: string | null;
    chaveEmpresa?: number;
  }) {
    const existing = await getRow();
    if (existing) {
      return prisma.chErpConfig.update({ where: { id: existing.id }, data });
    }
    return prisma.chErpConfig.create({ data });
  },
};
