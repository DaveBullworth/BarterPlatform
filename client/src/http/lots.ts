import { $authHost, $host } from './index';
import type {
  CreateLotDto,
  GetLotsParams,
  LotDto,
  LotResponseDto,
  UpdateLotDto,
} from '@/types/lot';
import type { PaginatedResponse } from '@/types/user';

const toLotEtag = (updatedAt?: string): string | undefined => {
  if (!updatedAt) return undefined;
  const time = Date.parse(updatedAt);
  if (Number.isNaN(time)) return undefined;
  return `W/"lot:${time}"`;
};

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
    '/lot',
    {
      params,
      signal,
    },
  );

  return data;
};

export const getLotById = async (
  id: string,
  updatedAt?: string,
): Promise<LotDto> => {
  const etag = toLotEtag(updatedAt);
  const { data } = await $authHost.get<LotDto>(`/lot/${id}`, {
    headers: etag ? { 'If-None-Match': etag } : undefined,
  });
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
