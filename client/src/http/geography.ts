import { $host } from './index';
import type { DistrictOption, RegionOption, CityOption } from '@/types/geo.dto';

export const getRegions = async (): Promise<RegionOption[]> => {
  const { data } = await $host.get<RegionOption[]>('/user/geography/regions');
  return data;
};

export const getCities = async (regionId?: number): Promise<CityOption[]> => {
  const { data } = await $host.get<CityOption[]>('/user/geography/cities', {
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
