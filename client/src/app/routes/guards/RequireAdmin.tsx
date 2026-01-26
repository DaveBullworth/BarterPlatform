import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { USER_ROLES } from '@/shared/constants/user-role';
import { ROUTES } from '@/shared/constants/routes';

// Проверка что пользователь авторизован и имеет роль `Админ`
export const RequireAdmin = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, role } = useSelector((s: RootState) => s.user);

  if (!isAuthenticated || role !== USER_ROLES.ADMIN) {
    return <Navigate to={ROUTES.ROOT} replace />;
  }

  return children;
};
