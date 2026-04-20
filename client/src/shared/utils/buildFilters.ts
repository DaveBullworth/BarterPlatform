import type { LotFilters } from '@/types/filters';
import type { CategorySelection } from '@/types/taxonomy';

import type { GeoFilterStorageValue } from './geoFilter';

export const buildFilters = (
  geoFilter: GeoFilterStorageValue,
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

  const normalizedQuery = searchQuery.trim();

  if (normalizedQuery) {
    filters.query = {
      type: 'text',
      operator: 'contains',
      value: normalizedQuery,
    };
  }

  return filters;
};
