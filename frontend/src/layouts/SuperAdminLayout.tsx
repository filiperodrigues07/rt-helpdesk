import { Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';

export function SuperAdminLayout() {
  const { superAdmin, logout } = useSuperAdminAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <p className="text-sm font-semibold">RT HELPDESK — Painel Super Admin</p>
          <p className="text-xs text-muted-foreground">{superAdmin?.email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
