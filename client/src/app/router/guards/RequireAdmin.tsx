import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/entities/user';
import { USER_ROLES } from '@/shared/constants/user-role';
import { ROUTES } from '@/shared/constants/routes';

export const RequireAdmin = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, currentUser } = useAuthStore();

  if (!isAuthenticated || currentUser?.role !== USER_ROLES.ADMIN) {
    return <Navigate to={ROUTES.ROOT} replace />;
  }

  return <>{children}</>;
};
