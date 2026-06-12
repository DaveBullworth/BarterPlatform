import { Home, User, Shield, CircleAlert, Handshake } from 'lucide-react';
import { createElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { ROUTES } from '@/shared/constants/routes';
import { NAV_ACCESS, type NavAccess } from '@/shared/constants/nav-access';

export type NavItem = {
  key: string;
  to: string;
  icon: LucideIcon;
  access: NavAccess;
  /**
   * Строковый ключ preload-чанка страницы.
   * Сами фабрики import() регистрируются в `app/router/routes` через
   * `registerPreloader` — нав-меню не знает про конкретные страницы.
   */
  preload?: string;
  description?: (ctx: { isAuthenticated: boolean }) => string | null;
  rightSection?: (ctx: { isAuthenticated: boolean }) => ReactNode;
};

export const NAV_ITEMS: NavItem[] = [
  {
    key: 'main',
    to: ROUTES.ROOT,
    icon: Home,
    access: NAV_ACCESS.PUBLIC,
    preload: 'feed',
  },
  {
    key: 'profile',
    to: ROUTES.PROFILE,
    icon: User,
    access: NAV_ACCESS.AUTH,
    preload: 'profile',
    description: ({ isAuthenticated }) =>
      !isAuthenticated ? 'nav.authRequired' : null,
    rightSection: ({ isAuthenticated }) =>
      !isAuthenticated
        ? createElement(CircleAlert, { size: 16, color: 'red' })
        : null,
  },
  {
    key: 'offers',
    to: ROUTES.OFFERS,
    icon: Handshake,
    access: NAV_ACCESS.AUTH,
    preload: 'offers',
    description: ({ isAuthenticated }) =>
      !isAuthenticated ? 'nav.authRequired' : null,
    rightSection: ({ isAuthenticated }) =>
      !isAuthenticated
        ? createElement(CircleAlert, { size: 16, color: 'red' })
        : null,
  },
  {
    key: 'admin',
    to: ROUTES.ADMIN,
    icon: Shield,
    access: NAV_ACCESS.ADMIN,
    preload: 'admin',
  },
];
