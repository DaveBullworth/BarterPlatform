import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { selectCurrentUser, selectIsAuthenticated } from '@/store/userSlice';
import { USER_ROLES } from '@/shared/constants/user-role';
import { ROUTES } from '@/shared/constants/routes';
import type { RootState } from '@/store';

// Проверка что пользователь авторизован и имеет роль `Админ`
export const RequireAdmin = ({ children }: PropsWithChildren) => {
  const user = useSelector((s: RootState) => selectCurrentUser(s));
  const isAuthenticated = useSelector((s: RootState) =>
    selectIsAuthenticated(s),
  );

  if (!isAuthenticated || user?.role !== USER_ROLES.ADMIN) {
    return <Navigate to={ROUTES.ROOT} replace />;
  }

  return children;
};
