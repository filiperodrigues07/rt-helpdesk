import { prisma } from '../utils/prisma';

// Configuração é uma linha única (singleton) — sempre a mais recente criada.
async function getRow() {
  return prisma.totalChatConfig.findFirst({ orderBy: { createdAt: 'asc' } });
}

export const totalChatConfigRepository = {
  get: getRow,

  async upsert(data: {
    apiUrl?: string | null;
    username?: string | null;
    password?: string | null;
    connectionId?: number | null;
    whatsappCloudApiFid?: number | null;
    pollingEnabled?: boolean;
    pollIntervalSeconds?: number;
  }) {
    const existing = await getRow();
    if (existing) {
      return prisma.totalChatConfig.update({ where: { id: existing.id }, data });
    }
    return prisma.totalChatConfig.create({ data });
  },
};
