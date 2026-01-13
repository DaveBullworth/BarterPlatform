import { useRoutes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { privateRoutes } from './private.routes';
import { publicRoutes } from './public.routes';

export const AppRoutes = () => {
  const isAuth = useSelector((state: RootState) => state.user.isAuthenticated);

  return useRoutes(isAuth ? privateRoutes : publicRoutes);
};
