import { prisma } from '../utils/prisma';

// Ainda no client global (não tenantPrisma): getRow() também é chamado pelo
// polling em background (integrations/totalchat/service.ts), que roda fora
// de uma requisição HTTP — não existe tenantId de contexto ali. Virar
// per-tenant de verdade (ver plano, Fase 2) exige também redesenhar o
// polling pra iterar por tenant, não só trocar esse import.
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
