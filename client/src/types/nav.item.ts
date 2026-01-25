import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { NavAccess } from '@/shared/constants/nav-access';

export type NavItem = {
  key: string;
  to: string;
  icon: LucideIcon;
  access: NavAccess;

  /**
   * Опциональные расширения поведения
   * Решаются на уровне Navbar
   */
  description?: (ctx: { isAuthenticated: boolean }) => ReactNode;
  rightSection?: (ctx: { isAuthenticated: boolean }) => ReactNode;
};
