import {
  useQuery,
  keepPreviousData,
  useQueryClient,
} from '@tanstack/react-query';
import { $host, $authHost } from '@/shared/api';
import {
  LotSchema,
  LotImagesResponseSchema,
  LotsMainImagesResponseSchema,
  PaginatedLotsSchema,
  CreateLotSchema,
  UpdateLotSchema,
  type Lot,
  type LotImage,
  type LotMainImage,
  type CreateLotDto,
  type UpdateLotDto,
  type GetLotsParams,
  type PaginatedLots,
} from './model';
import { createEtagBuilder } from '@/shared/lib/';

const toLotEtag = createEtagBuilder('lot');

// ============================================================
// Query keys
// ============================================================

export const lotKeys = {
  all: () => ['lots'] as const,
  lists: () => [...lotKeys.all(), 'list'] as const,
  list: (params: GetLotsParams) => [...lotKeys.lists(), params] as const,
  details: () => [...lotKeys.all(), 'detail'] as const,
  detail: (id: string) => [...lotKeys.details(), id] as const,
  images: (id: string) => [...lotKeys.detail(id), 'images'] as const,
  mainImages: (ids: string[]) =>
    [...lotKeys.all(), 'main-images', ids] as const,
};

// ============================================================
// Fetcher-ы — голые async функции
// Используются в useQuery (queryFn) и в useMutation (mutationFn) из features
// ============================================================

export const lotApi = {
  getList: async (
    params: GetLotsParams,
    signal?: AbortSignal,
  ): Promise<PaginatedLots> => {
    const { data } = await $host.get('/lot', { params, signal });
    return PaginatedLotsSchema.parse(data);
  },

  getById: async (id: string, updatedAt?: string): Promise<Lot> => {
    const etag = toLotEtag(updatedAt);
    const { data } = await $authHost.get(`/lot/${id}`, {
      headers: etag ? { 'If-None-Match': etag } : undefined,
    });
    return LotSchema.parse(data);
  },

  create: async (dto: CreateLotDto): Promise<Lot> => {
    const validated = CreateLotSchema.parse(dto);
    const { data } = await $authHost.post('/lot', validated);
    return LotSchema.parse(data);
  },

  update: async (id: string, dto: UpdateLotDto): Promise<Lot> => {
    const validated = UpdateLotSchema.parse(dto);
    const { data } = await $authHost.patch(`/lot/${id}`, validated);
    return LotSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await $authHost.delete(`/lot/${id}`);
  },

  getImages: async (lotId: string): Promise<LotImage[]> => {
    const { data } = await $host.get(`/media/lots/${lotId}/images`);
    return LotImagesResponseSchema.parse(data).images;
  },

  getMainImages: async (lotIds: string[]): Promise<LotMainImage[]> => {
    const { data } = await $host.post('/media/lots/main-images', { lotIds });
    return LotsMainImagesResponseSchema.parse(data).items;
  },

  uploadImage: async (
    lotId: string,
    file: File,
  ): Promise<{ imageId: string; isPrimary: boolean }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await $authHost.post(
      `/media/lots/${lotId}/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data as { imageId: string; isPrimary: boolean };
  },

  setPrimaryImage: async (lotId: string, imageId: string): Promise<void> => {
    await $authHost.post(`/media/lots/${lotId}/images/primary`, { imageId });
  },

  deleteImage: async (imageId: string): Promise<void> => {
    await $authHost.delete(`/media/lots/images/${imageId}`);
  },
};

export const getLotOriginalImageUrl = (imageId: string): string =>
  `${import.meta.env.VITE_API_URL}/media/lots/images/${imageId}/original`;

// ============================================================
// Query хуки — только чтение
// ============================================================

export const useLots = (params: GetLotsParams) => {
  return useQuery({
    queryKey: lotKeys.list(params),
    queryFn: ({ signal }) => lotApi.getList(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
  });
};

export const useLot = (id: string | undefined) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: lotKeys.detail(id!),
    queryFn: () => {
      const cached = queryClient.getQueryData<Lot>(lotKeys.detail(id!));
      return lotApi.getById(id!, cached?.updatedAt);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });
};

export const useLotImages = (lotId: string | undefined) => {
  return useQuery({
    queryKey: lotKeys.images(lotId!),
    queryFn: () => lotApi.getImages(lotId!),
    enabled: Boolean(lotId),
    staleTime: 1000 * 60 * 5,
  });
};

export const useLotsMainImages = (lotIds: string[]) => {
  return useQuery({
    queryKey: lotKeys.mainImages(lotIds),
    queryFn: () => lotApi.getMainImages(lotIds),
    enabled: lotIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
};
