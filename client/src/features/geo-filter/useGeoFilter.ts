import { useState, useEffect, useCallback } from 'react';
import {
  readStoredGeoFilter,
  saveGeoFilter,
  EMPTY_GEO_FILTER,
  GEO_FILTER_CHANGED_EVENT,
  type GeoFilterValue,
} from '@/shared/lib';

export const useGeoFilter = () => {
  const [filter, setFilter] = useState<GeoFilterValue>(readStoredGeoFilter);

  // Синхронизация между вкладками и компонентами
  /**
   * Мы используем localStorage для синхронизации фильтра между вкладками.
   * Проблема — localStorage не реактивный.
   * Когда один компонент записывает туда значение, другой компонент не узнает об этом автоматически.
   * Поэтому мы используем useEffect для синхронизации значений между вкладками.
   * */
  useEffect(() => {
    const sync = () => setFilter(readStoredGeoFilter());

    window.addEventListener('storage', sync);
    window.addEventListener(GEO_FILTER_CHANGED_EVENT, sync);

    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(GEO_FILTER_CHANGED_EVENT, sync);
    };
  }, []);

  const apply = useCallback((value: GeoFilterValue) => {
    setFilter(value);
    saveGeoFilter(value);
  }, []);

  const reset = useCallback(() => {
    setFilter(EMPTY_GEO_FILTER);
    saveGeoFilter(EMPTY_GEO_FILTER);
  }, []);

  const hasFilter = Boolean(
    filter.regionId || filter.cityId || filter.districtId,
  );

  return {
    filter,
    hasFilter,
    apply,
    reset,
  };
};
