import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Menu, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NotificationBell } from '@/components/NotificationBell';

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
  chamados: 'Detalhes do chamado',
  clientes: 'Detalhes do cliente',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function useBreadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: 'Dashboard', to: '/' }];
  }

  const section = segments[0];

  return segments.map((segment, index) => {
    let label = SECTION_LABELS[segment];

    if (label === undefined) {
      if (segment === 'novo') {
        label = NEW_LABELS[section] ?? 'Novo';
      } else if (segment === 'editar') {
        label = 'Editar';
      } else if (UUID_PATTERN.test(segment)) {
        label = DETAIL_LABELS[section] ?? 'Detalhes';
      } else {
        label = segment;
      }
    }

    return { label, to: '/' + segments.slice(0, index + 1).join('/') };
  });
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const breadcrumb = useBreadcrumb();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-background px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-4 w-4" />
        </Button>
        <nav className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          {breadcrumb.map((crumb, index) => (
            <React.Fragment key={crumb.to}>
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              {index === breadcrumb.length - 1 ? (
                <span className="truncate font-medium text-foreground">{crumb.label}</span>
              ) : (
                <Link to={crumb.to} className="truncate hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSearchOpen(true)}
          className="hidden text-muted-foreground sm:inline-flex"
        >
          <Search className="h-4 w-4" />
          Pesquisar...
          <kbd className="ml-4 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            Ctrl K
          </kbd>
        </Button>

        <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setSearchOpen(true)}>
          <Search className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/chamados/novo')}>Novo chamado</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/agenda')}>Novo evento na agenda</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/clientes/novo')}>Novo cliente</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationBell />

        <UserMenu>
          <button className="outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user ? initials(user.name) : '--'}</AvatarFallback>
            </Avatar>
          </button>
        </UserMenu>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
