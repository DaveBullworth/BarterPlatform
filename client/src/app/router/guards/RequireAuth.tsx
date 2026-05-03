import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/entities/user';
import { ROUTES } from '@/shared/constants/routes';

export const RequireAuth = ({ children }: PropsWithChildren) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH} replace />;
  }

  return <>{children}</>;
};
