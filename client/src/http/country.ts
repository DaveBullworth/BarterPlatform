import { $host } from './index';
import type { Country } from '@/types/country';

export const getCountries = async (
  signal?: AbortSignal,
): Promise<Country[]> => {
  const { data } = await $host.get<Country[]>('/countries', {
    signal,
  });

  return data;
};
