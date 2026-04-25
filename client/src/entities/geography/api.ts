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

const fetchDistricts = async (cityId: number): Promise<District[]> => {
  const { data } = await $host.get('/user/geography/districts', {
    params: { cityId },
  });
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
