import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/shared/constants/routes';
import { selectIsAuthenticated } from '@/store/userSlice';
import type { RootState } from '@/store';

// Проверка что пользователь авторизован
export const RequireAuth = ({ children }: PropsWithChildren) => {
  const isAuthenticated = useSelector((s: RootState) =>
    selectIsAuthenticated(s),
  );

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH} replace />;
  }

  return children;
};
