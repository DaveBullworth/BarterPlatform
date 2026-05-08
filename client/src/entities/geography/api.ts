import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { $host } from '@/shared/api';
import { toSelectOption } from './lib';
import {
  RegionSchema,
  CitySchema,
  DistrictSchema,
  type Region,
  type City,
  type District,
  type GeoSelectOption,
} from './model';

// query keys — централизованно, чтобы инвалидировать точечно
export const geoKeys = {
  regions: () => ['geography', 'regions'] as const,
  cities: (regionId: number) => ['geography', 'cities', regionId] as const,
  districts: (cityId: number) => ['geography', 'districts', cityId] as const,
  allCities: () => ['geography', 'cities', 'all'] as const,
  allDistricts: () => ['geography', 'districts', 'all'] as const,
};

// Сырые fetcher функции — отдельно от хуков
// Можно использовать в prefetch, в мутациях, в тестах
const fetchRegions = async (): Promise<Region[]> => {
  const { data } = await $host.get('/user/geography/regions');
  return RegionSchema.array().parse(data); // Zod валидирует ответ сервера
};

const fetchCities = async (regionId: number): Promise<City[]> => {
  const { data } = await $host.get('/user/geography/cities', {
    params: { regionId },
  });
  return CitySchema.array().parse(data);
};

const fetchAllCities = async (): Promise<City[]> => {
  const { data } = await $host.get('/user/geography/cities');
  return CitySchema.array().parse(data);
};

const fetchDistricts = async (cityId: number): Promise<District[]> => {
  const { data } = await $host.get('/user/geography/districts', {
    params: { cityId },
  });
  return DistrictSchema.array().parse(data);
};

const fetchAllDistricts = async (): Promise<District[]> => {
  const { data } = await $host.get('/user/geography/districts');
  return DistrictSchema.array().parse(data);
};

// React Query хуки — публичный API entity

export const useRegions = () => {
  return useQuery({
    queryKey: geoKeys.regions(),
    queryFn: fetchRegions,
    staleTime: Infinity, // регионы не меняются — кешируем навсегда
  });
};

export const useCities = (regionId: number | null) => {
  return useQuery({
    queryKey: geoKeys.cities(regionId!),
    queryFn: () => fetchCities(regionId!),
    enabled: regionId !== null, // не запрашиваем если regionId не выбран
    staleTime: Infinity,
  });
};

export const useDistricts = (cityId: number | null) => {
  return useQuery({
    queryKey: geoKeys.districts(cityId!),
    queryFn: () => fetchDistricts(cityId!),
    enabled: cityId !== null,
    staleTime: Infinity,
  });
};

// Полные списки без каскадной фильтрации — для админ-фильтров с multi-select,
// где варианты комбинируются через OR на сервере и нет смысла ограничивать список.
export const useAllCities = () => {
  return useQuery({
    queryKey: geoKeys.allCities(),
    queryFn: fetchAllCities,
    staleTime: Infinity,
  });
};

export const useAllDistricts = () => {
  return useQuery({
    queryKey: geoKeys.allDistricts(),
    queryFn: fetchAllDistricts,
    staleTime: Infinity,
  });
};

// Производные хуки — данные уже готовы к рендеру
// Компонент получает options и не знает как они получены

export const useRegionOptions = (): GeoSelectOption[] => {
  const { data = [] } = useRegions();
  return [...data]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(toSelectOption);
};

export const useCityOptions = (regionId: number | null): GeoSelectOption[] => {
  const { data = [] } = useCities(regionId);
  return [...data]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(toSelectOption);
};

export const useDistrictOptions = (
  cityId: number | null,
): GeoSelectOption[] => {
  const { data = [] } = useDistricts(cityId);
  return [...data]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(toSelectOption);
};

// Дублирующиеся имена городов («Другие города» в каждой области, одноимённые
// райцентры) и районов разрешаем уточнением в скобках: city → имя региона,
// district → имя города. Уникальные имена не трогаем — UI не зашумляется.
export const useAllCityOptions = (): GeoSelectOption[] => {
  const { data: cities = [] } = useAllCities();
  const { data: regions = [] } = useRegions();

  return useMemo(() => {
    const regionName = new Map(regions.map((r) => [r.id, r.name]));
    const nameCount = new Map<string, number>();
    for (const c of cities) {
      nameCount.set(c.name, (nameCount.get(c.name) ?? 0) + 1);
    }

    return [...cities]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        value: String(c.id),
        label:
          (nameCount.get(c.name) ?? 0) > 1
            ? `${c.name} (${regionName.get(c.regionId) ?? '—'})`
            : c.name,
      }));
  }, [cities, regions]);
};

export const useAllDistrictOptions = (): GeoSelectOption[] => {
  const { data: districts = [] } = useAllDistricts();
  const { data: cities = [] } = useAllCities();

  return useMemo(() => {
    const cityName = new Map(cities.map((c) => [c.id, c.name]));
    const nameCount = new Map<string, number>();
    for (const d of districts) {
      nameCount.set(d.name, (nameCount.get(d.name) ?? 0) + 1);
    }

    return [...districts]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((d) => ({
        value: String(d.id),
        label:
          (nameCount.get(d.name) ?? 0) > 1
            ? `${d.name} (${cityName.get(d.cityId) ?? '—'})`
            : d.name,
      }));
  }, [districts, cities]);
};
