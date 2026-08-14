import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasScreenPermission } from '@/utils/screenPermissions';

interface ScreenRouteProps {
  permission: string;
}

export function ScreenRoute({ permission }: ScreenRouteProps) {
  const { user } = useAuth();

  if (!hasScreenPermission(user, permission)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
