import { Prisma } from '@prisma/client';
import { prisma as basePrisma } from './prisma';
import { tenantContext } from './tenantContext';

// Models com coluna tenantId direta (ver prisma/schema.prisma). CustomerContact e
// Notification ficam de fora de propósito — são escopados transitivamente via
// Customer/User.
const TENANT_SCOPED_MODELS = new Set<Prisma.ModelName>([
  'Role',
  'User',
  'Customer',
  'Category',
  'Tag',
  'SlaRule',
  'Ticket',
  'Appointment',
  'Integration',
  'TotalChatConfig',
  'ChErpConfig',
]);

const WHERE_OPERATIONS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
]);

function withTenant(where: Record<string, unknown> | undefined, tenantId: string) {
  return { ...(where ?? {}), tenantId };
}

// Os repositórios sempre montam `create`/`upsert` no estilo "Checked" do Prisma
// (relação via connect, ex.: `customer: { connect: { id } }`), nunca o
// "Unchecked" com FK escalar direta — por isso o tenant também entra como
// relação aqui, não como campo `tenantId` solto (senão o Prisma rejeita em
// runtime: "Unknown argument tenantId").
function withTenantRelation(data: Record<string, unknown> | undefined, tenantId: string) {
  const result = { ...(data ?? {}) };
  if (result.tenantId === undefined && result.tenant === undefined) {
    result.tenant = { connect: { id: tenantId } };
  }
  return result;
}

/**
 * Client Prisma que injeta automaticamente o filtro/valor de tenantId em toda
 * query pros models tenant-scoped, usando o tenantId da requisição atual
 * (tenantContext, populado pelo middleware tenantScope). Repositórios que
 * usam esse client em vez do `prisma` global de utils/prisma.ts ficam
 * isolados por tenant sem precisar montar `where: { tenantId }` manualmente
 * em cada query.
 */
export const tenantPrisma = basePrisma.$extends({
  name: 'tenant-scope',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!model || !TENANT_SCOPED_MODELS.has(model)) {
          return query(args);
        }

        const tenantId = tenantContext.getTenantId();
        const scopedArgs = { ...(args as Record<string, unknown>) };

        if (WHERE_OPERATIONS.has(operation)) {
          scopedArgs.where = withTenant(scopedArgs.where as Record<string, unknown> | undefined, tenantId);
        } else if (operation === 'create') {
          scopedArgs.data = withTenantRelation(scopedArgs.data as Record<string, unknown> | undefined, tenantId);
        } else if (operation === 'createMany') {
          // createMany não aceita sintaxe de relação (connect) — só campo escalar.
          const data = scopedArgs.data;
          const rows = Array.isArray(data) ? data : [data];
          scopedArgs.data = rows.map((row) => ({ tenantId, ...(row as Record<string, unknown>) }));
        } else if (operation === 'upsert') {
          scopedArgs.where = withTenant(scopedArgs.where as Record<string, unknown> | undefined, tenantId);
          scopedArgs.create = withTenantRelation(scopedArgs.create as Record<string, unknown> | undefined, tenantId);
        }

        return query(scopedArgs);
      },
    },
  },
});
