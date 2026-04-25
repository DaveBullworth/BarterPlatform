export const TABLES = {
  USERS: 'USERS',
} as const;

export type TableKey = (typeof TABLES)[keyof typeof TABLES];
