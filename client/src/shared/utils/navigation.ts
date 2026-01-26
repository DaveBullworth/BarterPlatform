import type { NavigateFunction } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export const goToAuth = (navigate: NavigateFunction, replace?: boolean) =>
  navigate(ROUTES.AUTH, { replace });

export const goToProfile = (navigate: NavigateFunction) =>
  navigate(ROUTES.PROFILE);

export const goToAdmin = (navigate: NavigateFunction) => navigate(ROUTES.ADMIN);
