import { RoleName, TicketPriority } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';

// Bootstrap de um tenant novo (Tenant + Roles + matriz de permissões padrão +
// usuário Administrador + SLA + categorias/tags genéricas), usado pelo
// endpoint POST /api/super-admin/tenants. Reflete os mesmos passos que
// prisma/seed.ts faz pro tenant "Empresa Principal" — deliberadamente NÃO
// compartilhado com o seed: seed.ts é idempotente (upsert, usado o tempo
// todo em dev), esta função é de criação única (lança erro em duplicidade).
// Roda inteira no client global (prisma), nunca tenantPrisma — não existe
// tenant/contexto ainda enquanto o tenant está sendo criado.

const DEFAULT_SLA_HOURS: Record<TicketPriority, number> = {
  BAIXA: 48,
  NORMAL: 24,
  ALTA: 8,
  CRITICA: 2,
};

const SCREEN_PERMISSIONS: Record<string, string> = {
  'screen.chamados': 'Tela Chamados',
  'screen.agenda': 'Tela Agenda',
  'screen.clientes': 'Tela Clientes',
  'screen.base-conhecimento': 'Tela Base de Conhecimento',
  'screen.equipe': 'Tela Equipe',
  'screen.relatorios': 'Tela Relatórios',
  'screen.configuracoes': 'Tela Configurações',
};

const DEFAULT_ROLE_SCREENS: Record<RoleName, string[]> = {
  ADMINISTRADOR: Object.keys(SCREEN_PERMISSIONS),
  GERENTE: Object.keys(SCREEN_PERMISSIONS),
  SUPORTE: ['screen.chamados', 'screen.agenda', 'screen.clientes', 'screen.base-conhecimento'],
  IMPLANTACAO: ['screen.chamados', 'screen.agenda', 'screen.clientes', 'screen.base-conhecimento'],
  VISUALIZACAO: ['screen.relatorios'],
};

// Stopgap deliberado: Category/Tag ainda não têm CRUD (só GET) em nenhum
// lugar da aplicação. Um tenant novo sem nenhuma categoria não impede criar
// chamado (categoryId é opcional), mas é uma péssima experiência de
// primeiro uso. Nomes genéricos de propósito — remover quando o CRUD de
// categoria for construído (Fase 2).
const DEFAULT_CATEGORIES = ['Suporte Geral', 'Financeiro', 'Outros'];
const DEFAULT_TAGS = ['urgente', 'duvida', 'bug'];

export interface ProvisionTenantInput {
  tenantName: string;
  tenantSlug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface ProvisionTenantResult {
  tenant: { id: string; name: string; slug: string; active: boolean; createdAt: Date };
  adminUser: { id: string; name: string; email: string };
}

export const tenantProvisioningService = {
  async provisionTenant(input: ProvisionTenantInput): Promise<ProvisionTenantResult> {
    const existingSlug = await prisma.tenant.findUnique({ where: { slug: input.tenantSlug } });
    if (existingSlug) {
      throw new AppError('Já existe um tenant com este slug', 409);
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: input.adminEmail } });
    if (existingEmail) {
      throw new AppError('Já existe um usuário cadastrado com este e-mail', 409);
    }

    const passwordHash = await bcrypt.hash(input.adminPassword, 10);

    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: input.tenantName, slug: input.tenantSlug },
      });

      const roles: Record<RoleName, { id: string }> = {} as Record<RoleName, { id: string }>;
      for (const name of Object.keys(DEFAULT_ROLE_SCREENS) as RoleName[]) {
        roles[name] = await tx.role.create({ data: { name, tenantId: tenant.id } });
      }

      // Catálogo de Permission é global (não por tenant) — upsert, não create.
      for (const [key, description] of Object.entries(SCREEN_PERMISSIONS)) {
        await tx.permission.upsert({ where: { key }, update: { description }, create: { key, description } });
      }
      const allPermissions = await tx.permission.findMany();
      const permissionByKey = new Map(allPermissions.map((p) => [p.key, p]));

      for (const [roleName, keys] of Object.entries(DEFAULT_ROLE_SCREENS) as [RoleName, string[]][]) {
        await tx.role.update({
          where: { id: roles[roleName].id },
          data: { permissions: { set: keys.map((key) => ({ id: permissionByKey.get(key)!.id })) } },
        });
      }

      const adminUser = await tx.user.create({
        data: {
          name: input.adminName,
          email: input.adminEmail,
          passwordHash,
          jobTitle: 'Administrador',
          roleId: roles.ADMINISTRADOR.id,
          tenantId: tenant.id,
        },
      });

      for (const [priority, hours] of Object.entries(DEFAULT_SLA_HOURS) as [TicketPriority, number][]) {
        await tx.slaRule.create({ data: { priority, responseTimeMin: hours * 60, tenantId: tenant.id } });
      }

      for (const name of DEFAULT_CATEGORIES) {
        await tx.category.create({ data: { name, tenantId: tenant.id } });
      }
      for (const name of DEFAULT_TAGS) {
        await tx.tag.create({ data: { name, tenantId: tenant.id } });
      }

      return {
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, active: tenant.active, createdAt: tenant.createdAt },
        adminUser: { id: adminUser.id, name: adminUser.name, email: adminUser.email },
      };
    });
  },
};
