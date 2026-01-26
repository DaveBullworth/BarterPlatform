import React from 'react';
import { Home, User, Shield, CircleAlert } from 'lucide-react';
import { NAV_ACCESS } from '@/shared/constants/nav-access';
import { ROUTES } from '@/shared/constants/routes';
import type { NavItem } from '@/types/nav.item';

export const NAV_ITEMS: NavItem[] = [
  {
    key: 'main',
    to: ROUTES.ROOT,
    icon: Home,
    access: NAV_ACCESS.PUBLIC,
  },
  {
    key: 'profile',
    to: ROUTES.PROFILE,
    icon: User,
    access: NAV_ACCESS.AUTH,
    description: ({ isAuthenticated }) =>
      !isAuthenticated ? 'nav.authRequired' : null,
    rightSection: ({ isAuthenticated }) =>
      !isAuthenticated
        ? React.createElement(CircleAlert, { size: 16, color: 'red' })
        : null,
  },
  {
    key: 'admin',
    to: ROUTES.ADMIN,
    icon: Shield,
    access: NAV_ACCESS.ADMIN,
  },
] as const;
