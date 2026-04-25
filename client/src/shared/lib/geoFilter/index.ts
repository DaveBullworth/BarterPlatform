export const GEO_FILTER_STORAGE_KEY = 'geo-filter';
export const GEO_FILTER_CHANGED_EVENT = 'geo-filter-changed';

export type GeoFilterValue = {
  regionId: string;
  cityId: string;
  districtId: string;
};

export const EMPTY_GEO_FILTER: GeoFilterValue = {
  regionId: '',
  cityId: '',
  districtId: '',
};

export const readStoredGeoFilter = (): GeoFilterValue => {
  try {
    const saved = localStorage.getItem(GEO_FILTER_STORAGE_KEY);
    if (!saved) return EMPTY_GEO_FILTER;

    const parsed = JSON.parse(saved) as Partial<GeoFilterValue>;
    return {
      regionId: parsed.regionId ?? '',
      cityId: parsed.cityId ?? '',
      districtId: parsed.districtId ?? '',
    };
  } catch {
    localStorage.removeItem(GEO_FILTER_STORAGE_KEY);
    return EMPTY_GEO_FILTER;
  }
};

export const saveGeoFilter = (filter: GeoFilterValue): void => {
  const hasValue = Boolean(
    filter.regionId || filter.cityId || filter.districtId,
  );

  if (hasValue) {
    localStorage.setItem(GEO_FILTER_STORAGE_KEY, JSON.stringify(filter));
  } else {
    localStorage.removeItem(GEO_FILTER_STORAGE_KEY);
  }

  window.dispatchEvent(new Event(GEO_FILTER_CHANGED_EVENT));
};
