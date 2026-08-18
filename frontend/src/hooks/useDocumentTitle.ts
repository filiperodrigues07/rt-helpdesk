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
  'base-de-conhecimento': 'Novo artigo',
};

const DETAIL_LABELS: Record<string, string> = {
  chamados: 'Chamado',
  clientes: 'Cliente',
  'base-de-conhecimento': 'Artigo',
};

function resolvePageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return SECTION_LABELS[''];
  }

  const section = segments[0];
  const last = segments[segments.length - 1];

  if (last === 'novo') return NEW_LABELS[section] ?? 'Novo';
  if (last === 'editar') return `Editar ${DETAIL_LABELS[section] ?? ''}`.trim();
  // Qualquer rota com um segundo segmento (id ou slug) é uma tela de detalhe.
  if (segments.length > 1) return DETAIL_LABELS[section] ?? SECTION_LABELS[section] ?? 'Detalhes';

  return SECTION_LABELS[section] ?? 'Página não encontrada';
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
