import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
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
import { createEtagBuilder } from '@/shared/lib';

// функция-строитель ETag из фабрики
const toLotEtag = createEtagBuilder('lot');

// Query keys

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

// Fetchers

const fetchLots = async (
  params: GetLotsParams,
  signal?: AbortSignal,
): Promise<PaginatedLots> => {
  const { data } = await $host.get('/lot', { params, signal });
  return PaginatedLotsSchema.parse(data);
};

const fetchLotById = async (id: string, updatedAt?: string): Promise<Lot> => {
  const etag = toLotEtag(updatedAt);
  const { data } = await $authHost.get(`/lot/${id}`, {
    headers: etag ? { 'If-None-Match': etag } : undefined,
  });
  return LotSchema.parse(data);
};

const fetchLotImages = async (lotId: string): Promise<LotImage[]> => {
  const { data } = await $host.get(`/media/lots/${lotId}/images`);
  return LotImagesResponseSchema.parse(data).images;
};

const fetchLotsMainImages = async (
  lotIds: string[],
): Promise<LotMainImage[]> => {
  const { data } = await $host.post('/media/lots/main-images', { lotIds });
  return LotsMainImagesResponseSchema.parse(data).items;
};

// Хуки для чтения

export const useLots = (params: GetLotsParams) => {
  return useQuery({
    queryKey: lotKeys.list(params),
    queryFn: ({ signal }) => fetchLots(params, signal),
    placeholderData: keepPreviousData, // плавная смена страниц без мигания
    staleTime: 1000 * 30, // 30 секунд — лента обновляется чаще
  });
};

export const useLot = (id: string | undefined) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: lotKeys.detail(id!),
    queryFn: () => {
      // Берём updatedAt из того что уже есть в кеше
      const cached = queryClient.getQueryData<Lot>(lotKeys.detail(id!));
      return fetchLotById(id!, cached?.updatedAt);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });
};

export const useLotImages = (lotId: string | undefined) => {
  return useQuery({
    queryKey: lotKeys.images(lotId!),
    queryFn: () => fetchLotImages(lotId!),
    enabled: Boolean(lotId),
    staleTime: 1000 * 60 * 5,
  });
};

export const useLotsMainImages = (lotIds: string[]) => {
  return useQuery({
    queryKey: lotKeys.mainImages(lotIds),
    queryFn: () => fetchLotsMainImages(lotIds),
    enabled: lotIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
};

// Мутации

export const useCreateLot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateLotDto): Promise<Lot> => {
      const validated = CreateLotSchema.parse(dto);
      const { data } = await $authHost.post('/lot', validated);
      return LotSchema.parse(data);
    },
    onSuccess: () => {
      // Инвалидируем список — лента обновится автоматически
      queryClient.invalidateQueries({ queryKey: lotKeys.lists() });
    },
  });
};

export const useUpdateLot = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: UpdateLotDto): Promise<Lot> => {
      const validated = UpdateLotSchema.parse(dto);
      const { data } = await $authHost.patch(`/lot/${id}`, validated);
      return LotSchema.parse(data);
    },
    onSuccess: (updatedLot) => {
      // Точечное обновление кеша — не делаем лишний запрос
      queryClient.setQueryData(lotKeys.detail(id), updatedLot);
      queryClient.invalidateQueries({ queryKey: lotKeys.lists() });
    },
  });
};

export const useDeleteLot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await $authHost.delete(`/lot/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.removeQueries({ queryKey: lotKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: lotKeys.lists() });
    },
  });
};

// Image мутации — изолированы от основного лота

export const useUploadLotImage = (lotId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await $authHost.post(
        `/media/lots/${lotId}/images`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data as { imageId: string; isPrimary: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lotKeys.images(lotId) });
    },
  });
};

export const useSetPrimaryLotImage = (lotId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageId: string) => {
      await $authHost.post(`/media/lots/${lotId}/images/primary`, { imageId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lotKeys.images(lotId) });
    },
  });
};

export const useDeleteLotImage = (lotId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageId: string) => {
      await $authHost.delete(`/media/lots/images/${imageId}`);
      return imageId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lotKeys.images(lotId) });
    },
  });
};

// URL оригинального изображения
export const getLotOriginalImageUrl = (imageId: string): string =>
  `${import.meta.env.VITE_API_URL}/media/lots/images/${imageId}/original`;
