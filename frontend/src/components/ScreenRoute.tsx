import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasScreenPermission } from '@/utils/screenPermissions';
import { ForbiddenPage } from '@/pages/ForbiddenPage';

interface ScreenRouteProps {
  permission: string;
}

export function ScreenRoute({ permission }: ScreenRouteProps) {
  const { user } = useAuth();

  if (!hasScreenPermission(user, permission)) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}
