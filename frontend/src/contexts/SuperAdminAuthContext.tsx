import * as React from 'react';
import { superAdminAuthService } from '@/services/superAdminAuthService';
import { SUPER_ADMIN_TOKEN_STORAGE_KEY } from '@/services/superAdminApi';
import type { SuperAdminUser } from '@/types';

interface SuperAdminAuthContextValue {
  superAdmin: SuperAdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const SuperAdminAuthContext = React.createContext<SuperAdminAuthContextValue | undefined>(undefined);

export function SuperAdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [superAdmin, setSuperAdmin] = React.useState<SuperAdminUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem(SUPER_ADMIN_TOKEN_STORAGE_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    superAdminAuthService
      .me()
      .then(setSuperAdmin)
      .catch(() => {
        localStorage.removeItem(SUPER_ADMIN_TOKEN_STORAGE_KEY);
        setSuperAdmin(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const result = await superAdminAuthService.login(email, password);
    localStorage.setItem(SUPER_ADMIN_TOKEN_STORAGE_KEY, result.token);
    setSuperAdmin(result.superAdmin);
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem(SUPER_ADMIN_TOKEN_STORAGE_KEY);
    setSuperAdmin(null);
  }, []);

  const value = React.useMemo(
    () => ({ superAdmin, isLoading, isAuthenticated: !!superAdmin, login, logout }),
    [superAdmin, isLoading, login, logout],
  );

  return <SuperAdminAuthContext.Provider value={value}>{children}</SuperAdminAuthContext.Provider>;
}

export function useSuperAdminAuth() {
  const context = React.useContext(SuperAdminAuthContext);
  if (!context) {
    throw new Error('useSuperAdminAuth deve ser usado dentro de um SuperAdminAuthProvider');
  }
  return context;
}
