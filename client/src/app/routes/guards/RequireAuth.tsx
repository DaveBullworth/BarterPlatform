import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

// Проверка что пользователь авторизован
export const RequireAuth = ({ children }: PropsWithChildren) => {
  const isAuth = useSelector((s: RootState) => s.user.isAuthenticated);

  if (!isAuth) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};
