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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';
import { UserAvatar } from '@/components/UserAvatar';
import { BrandLogo } from '@/components/BrandLogo';
import { hasScreenPermission, SCREEN_PERMISSIONS } from '@/utils/screenPermissions';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, permission: null },
  { to: '/chamados', label: 'Chamados', icon: Ticket, permission: SCREEN_PERMISSIONS.chamados },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, permission: SCREEN_PERMISSIONS.agenda },
  { to: '/clientes', label: 'Clientes', icon: Users, permission: SCREEN_PERMISSIONS.clientes },
  {
    to: '/base-de-conhecimento',
    label: 'Base de Conhecimento',
    icon: BookOpen,
    permission: SCREEN_PERMISSIONS.baseConhecimento,
  },
  { to: '/equipe', label: 'Equipe', icon: UsersRound, permission: SCREEN_PERMISSIONS.equipe },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3, permission: SCREEN_PERMISSIONS.relatorios },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, permission: SCREEN_PERMISSIONS.configuracoes },
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
      <div className={cn('flex h-16 items-center border-b border-sidebar-border px-4', !collapsed && 'gap-2.5')}>
        <BrandLogo className="h-10 w-10 shrink-0" />
        {!collapsed && (
          <span className="truncate text-sm font-semibold tracking-wide">RT HELPDESK</span>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
        {NAV_ITEMS.filter((item) => !item.permission || hasScreenPermission(user, item.permission)).map((item) => {
          const Icon = item.icon;
          const link = (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-sidebar-foreground/70',
                  collapsed && 'justify-center px-0',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-primary" />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
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
        <div className={cn('flex', collapsed ? 'justify-center' : 'justify-end')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggle}
                aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
                className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? 'right' : 'top'}>
              {collapsed ? 'Expandir menu' : 'Recolher menu'}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className={cn('mt-1 flex items-center gap-2 rounded-md', collapsed && 'justify-center')}>
          <UserMenu collapsed={collapsed}>
            <button className="flex w-full items-center gap-2 rounded-md p-2 text-left outline-none transition-colors hover:bg-accent">
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
