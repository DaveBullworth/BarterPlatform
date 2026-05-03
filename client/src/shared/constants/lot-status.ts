// Статусы — единственный источник правды
export const LOT_STATUS = {
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  ARCHIVED: 'archived',
} as const;

export type LotStatus = (typeof LOT_STATUS)[keyof typeof LOT_STATUS];
