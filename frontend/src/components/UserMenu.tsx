import * as React from 'react';
import { LogOut, Monitor, Moon, Sun, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';
import { ProfileDialog } from '@/components/ProfileDialog';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
] as const;

interface UserMenuProps {
  children: React.ReactNode;
  collapsed?: boolean;
}

export function UserMenu({ children, collapsed }: UserMenuProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align={collapsed ? 'center' : 'start'} side="top" className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span className="truncate text-sm font-medium text-foreground">{user?.name}</span>
            <span className="truncate text-xs">{user?.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setProfileOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            Meu perfil
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Tema</DropdownMenuLabel>
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(theme === option.value && 'bg-accent text-accent-foreground')}
              >
                <Icon className="mr-2 h-4 w-4" />
                {option.label}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
