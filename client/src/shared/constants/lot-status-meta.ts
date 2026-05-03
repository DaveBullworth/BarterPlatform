import type { LotStatusMeta } from '@/entities/lot/lib';
import { LOT_STATUS, type LotStatus } from './lot-status';

export const LOT_STATUS_META: Record<LotStatus, LotStatusMeta> = {
  [LOT_STATUS.ACTIVE]: {
    color: 'green',
    labelKey: 'lot.visibility.active',
  },
  [LOT_STATUS.HIDDEN]: {
    color: 'red',
    labelKey: 'lot.visibility.hidden',
  },
  [LOT_STATUS.ARCHIVED]: {
    color: 'gray',
    labelKey: 'lot.visibility.archived',
  },
};
