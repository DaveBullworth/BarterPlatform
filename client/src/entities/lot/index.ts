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

// Утилиты
export {
  getLotStatusMeta,
  isLotActive,
  isLotArchived,
  isLotHidden,
  resolveLotActions,
  toLotImageSrc,
} from './lib';

export type { LotStatusMeta, LotActions, ImageSource } from './lib';

// Хуки
export {
  useLots,
  useLot,
  useLotImages,
  useLotsMainImages,
  useCreateLot,
  useUpdateLot,
  useDeleteLot,
  useUploadLotImage,
  useSetPrimaryLotImage,
  useDeleteLotImage,
  getLotOriginalImageUrl,
  lotKeys,
} from './api';
