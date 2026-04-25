export const NAV_ACCESS = {
  PUBLIC: 'public',
  AUTH: 'auth',
  ADMIN: 'admin',
} as const;

export type NavAccess = (typeof NAV_ACCESS)[keyof typeof NAV_ACCESS];
