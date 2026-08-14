import type { AuthenticatedUser } from '@/types';

export const SCREEN_PERMISSIONS = {
  chamados: 'screen.chamados',
  agenda: 'screen.agenda',
  clientes: 'screen.clientes',
  baseConhecimento: 'screen.base-conhecimento',
  equipe: 'screen.equipe',
  relatorios: 'screen.relatorios',
  configuracoes: 'screen.configuracoes',
} as const;

export function hasScreenPermission(user: AuthenticatedUser | null, key: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMINISTRADOR') return true;
  return user.permissions.includes(key);
}
