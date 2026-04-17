import type { PaginatedResponse } from '@/types/user';
import { $authHost, $host } from './index';
import type {
  CreateLotDto,
  GetLotsParams,
  LotDto,
  LotResponseDto,
  UpdateLotDto,
} from '@/types/lot';

export const getLotsTaxonomy = async () => {
  const { data } = await $host.get('/lot/taxonomy');
  return data;
};

export const createLot = async (dto: CreateLotDto): Promise<LotDto> => {
  const { data } = await $authHost.post<LotDto>('/lot', dto);
  return data;
};

export const getLots = async (
  params: GetLotsParams,
  signal?: AbortSignal,
): Promise<PaginatedResponse<LotResponseDto>> => {
  const { data } = await $authHost.get<PaginatedResponse<LotResponseDto>>(
    '/user',
    {
      params,
      signal,
    },
  );

  return data;
};

export const getLotById = async (id: string): Promise<LotDto> => {
  const { data } = await $authHost.get<LotDto>(`/lot/${id}`);
  return data;
};

export const updateLot = async (
  id: string,
  dto: UpdateLotDto,
): Promise<LotDto> => {
  const { data } = await $authHost.patch<LotDto>(`/lot/${id}`, dto);
  return data;
};

export const deleteLot = async (id: string): Promise<{ success: boolean }> => {
  const { data } = await $authHost.delete<{ success: boolean }>(`/lot/${id}`);
  return data;
};
