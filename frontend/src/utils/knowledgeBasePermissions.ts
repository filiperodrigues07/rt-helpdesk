import type { AuthenticatedUser } from '@/types';
import { hasScreenPermission, SCREEN_PERMISSIONS } from '@/utils/screenPermissions';

const MANAGER_ROLES = ['ADMINISTRADOR', 'GERENTE'] as const;

// Espelha as duas travas que o backend já exige em knowledgeBase.routes.ts
// pra criar/editar/excluir artigo: authorize('ADMINISTRADOR','GERENTE') +
// requireScreenPermission('screen.base-conhecimento').
export function canManageKnowledgeBase(user: AuthenticatedUser | null): boolean {
  if (!user) return false;
  if (!MANAGER_ROLES.includes(user.role as (typeof MANAGER_ROLES)[number])) return false;
  return hasScreenPermission(user, SCREEN_PERMISSIONS.baseConhecimento);
}
