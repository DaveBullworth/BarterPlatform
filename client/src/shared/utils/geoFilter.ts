export const GEO_FILTER_STORAGE_KEY = 'geo-filter';
export const GEO_FILTER_CHANGED_EVENT = 'geo-filter-changed';

export type GeoFilterStorageValue = {
  regionId: string;
  cityId: string;
  districtId: string;
};

export const EMPTY_GEO_FILTER: GeoFilterStorageValue = {
  regionId: '',
  cityId: '',
  districtId: '',
};

export const readStoredGeoFilter = (): GeoFilterStorageValue => {
  if (typeof window === 'undefined') {
    return EMPTY_GEO_FILTER;
  }

  const saved = localStorage.getItem(GEO_FILTER_STORAGE_KEY);

  if (!saved) {
    return EMPTY_GEO_FILTER;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<GeoFilterStorageValue>;

    return {
      regionId: parsed.regionId || '',
      cityId: parsed.cityId || '',
      districtId: parsed.districtId || '',
    };
  } catch (error) {
    console.error(error);
    localStorage.removeItem(GEO_FILTER_STORAGE_KEY);
    return EMPTY_GEO_FILTER;
  }
};
