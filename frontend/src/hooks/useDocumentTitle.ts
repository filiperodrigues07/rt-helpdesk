import * as React from 'react';
import { useLocation } from 'react-router-dom';

const BRAND = 'RT Helpdesk';

const SECTION_LABELS: Record<string, string> = {
  '': 'Dashboard',
  chamados: 'Chamados',
  agenda: 'Agenda',
  clientes: 'Clientes',
  'base-de-conhecimento': 'Base de Conhecimento',
  equipe: 'Equipe',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
};

const NEW_LABELS: Record<string, string> = {
  chamados: 'Novo chamado',
  clientes: 'Novo cliente',
};

const DETAIL_LABELS: Record<string, string> = {
  chamados: 'Chamado',
  clientes: 'Cliente',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolvePageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return SECTION_LABELS[''];
  }

  const section = segments[0];
  const last = segments[segments.length - 1];

  if (last === 'novo') return NEW_LABELS[section] ?? 'Novo';
  if (last === 'editar') return `Editar ${DETAIL_LABELS[section] ?? ''}`.trim();
  if (UUID_PATTERN.test(last)) return DETAIL_LABELS[section] ?? SECTION_LABELS[section] ?? 'Detalhes';

  return SECTION_LABELS[section] ?? SECTION_LABELS[''];
}

/**
 * Mantém a aba do navegador com "Página - RT Helpdesk". Sem `explicitTitle`,
 * a página é deduzida da rota atual (usado uma única vez no AppLayout,
 * cobre todas as telas internas ao navegar).
 */
export function useDocumentTitle(explicitTitle?: string) {
  const { pathname } = useLocation();

  React.useEffect(() => {
    const page = explicitTitle ?? resolvePageTitle(pathname);
    document.title = page ? `${page} - ${BRAND}` : BRAND;
  }, [pathname, explicitTitle]);
}
