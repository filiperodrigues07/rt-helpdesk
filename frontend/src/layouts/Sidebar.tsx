import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  CalendarDays,
  Users,
  BookOpen,
  UsersRound,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';
import { UserAvatar } from '@/components/UserAvatar';
import { BrandLogo } from '@/components/BrandLogo';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/chamados', label: 'Chamados', icon: Ticket },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/base-de-conhecimento', label: 'Base de Conhecimento', icon: BookOpen },
  { to: '/equipe', label: 'Equipe', icon: UsersRound },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function Sidebar({ collapsed, onToggle, className }: SidebarProps) {
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200',
        collapsed ? 'w-[68px]' : 'w-64',
        className,
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <BrandLogo className="h-7 w-7 shrink-0" />
        {!collapsed && (
          <span className="truncate text-sm font-semibold tracking-wide">RT HELPDESK</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const link = (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground/80',
                  collapsed && 'justify-center px-0',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );

          if (!collapsed) return link;

          return (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn('mb-2 w-full justify-center text-sidebar-foreground/70')}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Recolher</span>}
        </Button>

        <Separator />

        <div className={cn('mt-2 flex items-center gap-2 rounded-md p-2', collapsed && 'justify-center')}>
          <UserMenu collapsed={collapsed}>
            <button className="flex w-full items-center gap-2 rounded-md text-left outline-none">
              <UserAvatar name={user?.name ?? '--'} avatarUrl={user?.avatarUrl} />
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user?.name}</p>
                  <p className="truncate text-xs text-sidebar-foreground/60">{user?.jobTitle}</p>
                </div>
              )}
            </button>
          </UserMenu>
        </div>
      </div>
    </aside>
  );
}

function Separator() {
  return <div className="h-px w-full bg-sidebar-border" />;
}
