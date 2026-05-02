// Константы
export { LOT_STATUS, type LotStatus } from '@/shared/constants/lot-status';

// Типы
export type {
  Lot,
  LotResponse,
  LotImage,
  LotMainImage,
  LotFilters,
  CreateLotDto,
  UpdateLotDto,
  GetLotsParams,
  PaginatedLots,
} from './model';

// Схемы
export {
  LotSchema,
  LotResponseSchema,
  LotImageSchema,
  LotImagesResponseSchema,
  LotMainImageSchema,
  LotsMainImagesResponseSchema,
  CreateLotSchema,
  UpdateLotSchema,
  GetLotsParamsSchema,
  PaginatedLotsSchema,
} from './model';

// Утилиты
export {
  getLotStatusMeta,
  isLotActive,
  isLotArchived,
  isLotHidden,
  resolveLotActions,
  toLotImageSrc,
  buildLotFilters,
} from './lib';

export type { LotStatusMeta, LotActions, ImageSource } from './lib';

// Хуки
export {
  useLots,
  useLot,
  useLotImages,
  useLotsMainImages,
  getLotOriginalImageUrl,
  lotApi,
  lotKeys,
} from './api';
