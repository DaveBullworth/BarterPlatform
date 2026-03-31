import { $host } from './index';
import type { GeoOption, DistrictOption } from '@/types/geo.dto';

export const getRegions = async (): Promise<GeoOption[]> => {
  const { data } = await $host.get<GeoOption[]>('/user/geography/regions');
  return data;
};

export const getCities = async (regionId?: number): Promise<GeoOption[]> => {
  const { data } = await $host.get<GeoOption[]>('/user/geography/cities', {
    params: regionId ? { regionId } : undefined,
  });
  return data;
};

export const getDistricts = async (
  cityId?: number,
): Promise<DistrictOption[]> => {
  const { data } = await $host.get<DistrictOption[]>(
    '/user/geography/districts',
    {
      params: cityId ? { cityId } : undefined,
    },
  );
  return data;
};
