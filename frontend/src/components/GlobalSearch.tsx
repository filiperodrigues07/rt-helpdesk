import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  CalendarDays,
  Users,
  BookOpen,
  UsersRound,
  BarChart3,
  Settings,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

const PAGES = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chamados', label: 'Chamados', icon: Ticket },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/base-de-conhecimento', label: 'Base de Conhecimento', icon: BookOpen },
  { to: '/equipe', label: 'Equipe', icon: UsersRound },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();

  const runCommand = React.useCallback(
    (to: string) => {
      onOpenChange(false);
      navigate(to);
    },
    [navigate, onOpenChange],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Pesquisar páginas, chamados, clientes..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          {PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem key={page.to} value={page.label} onSelect={() => runCommand(page.to)}>
                <Icon className="h-4 w-4" />
                {page.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
