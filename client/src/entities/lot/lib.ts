import { LOT_STATUS, type LotStatus } from '@/shared/constants/lot-status';
import { LOT_STATUS_META } from '@/shared/constants/lot-status-meta';
import type { LotFilters } from '@/entities/lot';
import type { CategorySelection } from '@/entities/taxonomy';
import type { GeoFilterValue } from '@/shared/lib/geoFilter';

// Статус → метаданные для UI
// Была inline логика в LotPage через useMemo + switch
export type LotStatusMeta = {
  color: string;
  labelKey: string; // ключ i18n
};

export const getLotStatusMeta = (status: LotStatus): LotStatusMeta =>
  LOT_STATUS_META[status];

// Проверки статуса — семантичнее чем сравнение строк в компонентах
export const isLotActive = (status: LotStatus): boolean =>
  status === LOT_STATUS.ACTIVE;

export const isLotArchived = (status: LotStatus): boolean =>
  status === LOT_STATUS.ARCHIVED;

export const isLotHidden = (status: LotStatus): boolean =>
  status === LOT_STATUS.HIDDEN;

// Определение действий доступных для лота
// Была разбросанная логика в LotPage и LotFormPage
export type LotActions = {
  canEdit: boolean;
  canDeactivate: boolean;
  canUnarchive: boolean;
};

export const resolveLotActions = (params: {
  lot: { userId: string; visibilityStatus: LotStatus };
  currentUserId: string | null;
  isAdmin: boolean;
}): LotActions => {
  const { lot, currentUserId, isAdmin } = params;
  const isOwner = currentUserId === lot.userId;
  const canEdit = isOwner || isAdmin;

  return {
    canEdit,
    canDeactivate: canEdit && !isLotArchived(lot.visibilityStatus),
    canUnarchive: canEdit && isLotArchived(lot.visibilityStatus),
  };
};

// Конвертация base64 изображения в src для <img>
// Была toImageSrc в shared/utils — но это доменная функция лота
export type ImageSource = {
  data?: string | null;
  mimeType?: string | null;
};

export const toLotImageSrc = (image?: ImageSource | null): string | null => {
  if (!image?.data || !image?.mimeType) return null;
  return `data:${image.mimeType};base64,${image.data}`;
};

// Функция для конвертации фильтров из UI в формат, который понимает API
export const buildLotFilters = (
  geoFilter: GeoFilterValue,
  selectedCategory: CategorySelection | null,
  searchQuery: string,
): LotFilters => {
  const filters: LotFilters = {};

  if (geoFilter.regionId) {
    filters.regionId = { type: 'id', value: geoFilter.regionId };
  }
  if (geoFilter.cityId) {
    filters.cityId = { type: 'id', value: geoFilter.cityId };
  }
  if (geoFilter.districtId) {
    filters.districtId = { type: 'id', value: geoFilter.districtId };
  }

  if (selectedCategory) {
    filters.chapterId = {
      type: 'id',
      value: String(selectedCategory.chapterId),
    };

    if (selectedCategory.level !== 'chapter') {
      filters.categoryId = {
        type: 'id',
        value: String(selectedCategory.categoryId),
      };
    }
    if (selectedCategory.level === 'subcategory') {
      filters.subcategoryId = {
        type: 'id',
        value: String(selectedCategory.subcategoryId),
      };
    }
  }

  const query = searchQuery.trim();
  if (query) {
    filters.query = { type: 'text', operator: 'contains', value: query };
  }

  return filters;
};
