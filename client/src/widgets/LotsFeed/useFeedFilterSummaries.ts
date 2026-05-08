import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useCities, useDistricts, useRegions } from '@/entities/geography';
import { useTaxonomy } from '@/entities/taxonomy';
import { useCategorySelection } from '@/features/category-filter';
import { useGeoFilter } from '@/features/geo-filter';
import { useSearchQuery } from '@/features/search-filter';

export type FeedFilterSummaries = {
  geoSummary: string;
  categorySummary: string;
  searchSummary: string;
};

// Сводки текущих фильтров ленты для информационного попавера.
// Хук читает источники сам — попавер не зависит от LotsFeed.
export const useFeedFilterSummaries = (): FeedFilterSummaries => {
  const { t } = useTranslation();
  const { filter: geoFilter } = useGeoFilter();
  const { selection } = useCategorySelection();
  const { query: searchQuery } = useSearchQuery();

  const regionIdNum = geoFilter.regionId ? Number(geoFilter.regionId) : null;
  const cityIdNum = geoFilter.cityId ? Number(geoFilter.cityId) : null;

  const { data: regions = [] } = useRegions();
  const { data: cities = [] } = useCities(regionIdNum);
  const { data: districts = [] } = useDistricts(cityIdNum);
  const { data: taxonomy = [] } = useTaxonomy();

  const geoSummary = useMemo(() => {
    const region =
      regions.find((item) => String(item.id) === geoFilter.regionId)?.name ??
      geoFilter.regionId;
    const city =
      cities.find((item) => String(item.id) === geoFilter.cityId)?.name ??
      geoFilter.cityId;
    const district =
      districts.find((item) => String(item.id) === geoFilter.districtId)
        ?.name ?? geoFilter.districtId;

    const parts = [region, city, district].filter(Boolean);
    return parts.length ? parts.join(' / ') : t('feed.filters.notSelected');
  }, [regions, cities, districts, geoFilter, t]);

  const categorySummary = useMemo(() => {
    if (!selection) {
      return t('feed.filters.notSelected');
    }

    const chapter = taxonomy.find((item) => item.id === selection.chapterId);
    const category =
      selection.level !== 'chapter'
        ? chapter?.categories.find((item) => item.id === selection.categoryId)
        : null;
    const subcategory =
      selection.level === 'subcategory'
        ? category?.subcategories.find(
            (item) => item.id === selection.subcategoryId,
          )
        : null;

    const labelParts = [
      chapter?.name,
      category?.name,
      subcategory?.name,
    ].filter(Boolean);

    if (labelParts.length) {
      return labelParts.join(' / ');
    }

    const fallbackParts = [`#${selection.chapterId}`];
    if (selection.level !== 'chapter') {
      fallbackParts.push(`#${selection.categoryId}`);
    }
    if (selection.level === 'subcategory') {
      fallbackParts.push(`#${selection.subcategoryId}`);
    }
    return fallbackParts.join(' / ');
  }, [selection, taxonomy, t]);

  const searchSummary = searchQuery.trim() || t('feed.filters.notSelected');

  return { geoSummary, categorySummary, searchSummary };
};
