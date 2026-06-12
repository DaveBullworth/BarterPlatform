import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { $authHost } from '@/shared/api';
import { lotKeys } from '@/entities/lot';
import {
  OfferSchema,
  OffersFeedSchema,
  OfferDetailSchema,
  PreferenceAvailabilitySchema,
  type CreateOfferDto,
  type Offer,
  type OfferDetail,
  type OfferRole,
  type OfferStatus,
  type OffersFeed,
  type PreferenceAvailability,
} from './model';

export type OffersFeedParams = {
  role: OfferRole;
  statuses?: OfferStatus[];
  page?: number;
  limit?: number;
  /** Только ADMIN — просмотр от лица другого пользователя. */
  asUserId?: string;
};

export const offerKeys = {
  all: () => ['offers'] as const,
  availability: (lotId: string) =>
    [...offerKeys.all(), 'availability', lotId] as const,
  feed: (params: OffersFeedParams) =>
    [...offerKeys.all(), 'feed', params] as const,
  detail: (id: string, asUserId?: string) =>
    [...offerKeys.all(), 'detail', id, asUserId ?? null] as const,
};

export const offerApi = {
  create: async (dto: CreateOfferDto): Promise<Offer> => {
    const { data } = await $authHost.post('/offers', dto);
    return OfferSchema.parse(data);
  },

  getAvailabilityForLot: async (
    lotId: string,
  ): Promise<PreferenceAvailability> => {
    const { data } = await $authHost.get(`/offers/availability/${lotId}`);
    return PreferenceAvailabilitySchema.parse(data);
  },

  getFeed: async (params: OffersFeedParams): Promise<OffersFeed> => {
    const { data } = await $authHost.get('/offers', {
      params: {
        role: params.role,
        // Сервер принимает CSV статусов.
        statuses: params.statuses?.length
          ? params.statuses.join(',')
          : undefined,
        page: params.page,
        limit: params.limit,
        asUserId: params.asUserId,
      },
    });
    return OffersFeedSchema.parse(data);
  },

  getOne: async (id: string, asUserId?: string): Promise<OfferDetail> => {
    const { data } = await $authHost.get(`/offers/${id}`, {
      params: { asUserId },
    });
    return OfferDetailSchema.parse(data);
  },

  accept: async (id: string, asUserId?: string): Promise<OfferDetail> => {
    const { data } = await $authHost.post(`/offers/${id}/accept`, null, {
      params: { asUserId },
    });
    return OfferDetailSchema.parse(data);
  },

  reject: async (id: string, asUserId?: string): Promise<OfferDetail> => {
    const { data } = await $authHost.post(`/offers/${id}/reject`, null, {
      params: { asUserId },
    });
    return OfferDetailSchema.parse(data);
  },

  confirm: async (id: string, asUserId?: string): Promise<OfferDetail> => {
    const { data } = await $authHost.post(`/offers/${id}/confirm`, null, {
      params: { asUserId },
    });
    return OfferDetailSchema.parse(data);
  },

  report: async (id: string, asUserId?: string): Promise<void> => {
    await $authHost.post(`/offers/${id}/report`, null, {
      params: { asUserId },
    });
  },
};

/** Лента предложений пользователя (с пагинацией и фильтрами). */
export const useOffersFeed = (params: OffersFeedParams) =>
  useQuery({
    queryKey: offerKeys.feed(params),
    queryFn: () => offerApi.getFeed(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 15,
  });

/** Детальная карточка предложения. asUserId — только для ADMIN. */
export const useOffer = (id: string | undefined, asUserId?: string) =>
  useQuery({
    queryKey: offerKeys.detail(id ?? 'none', asUserId),
    queryFn: () => offerApi.getOne(id!, asUserId),
    enabled: Boolean(id),
    staleTime: 1000 * 15,
  });

/**
 * Действия над предложением (accept/reject/confirm) — после успеха обновляют
 * кэш детали и инвалидируют ленту.
 */
const useOfferTransition = (
  mutationFn: (id: string, asUserId?: string) => Promise<OfferDetail>,
  id: string,
  asUserId?: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mutationFn(id, asUserId),
    onSuccess: (detail) => {
      queryClient.setQueryData(offerKeys.detail(id, asUserId), detail);
      queryClient.invalidateQueries({ queryKey: offerKeys.all() });
      // Статус предложения влияет на лоты: отклонение возвращает целевой лот
      // в выдачу, завершение обмена меняет владельцев и скрывает лоты.
      queryClient.invalidateQueries({ queryKey: lotKeys.all() });
    },
  });
};

export const useAcceptOffer = (id: string, asUserId?: string) =>
  useOfferTransition(offerApi.accept, id, asUserId);

export const useRejectOffer = (id: string, asUserId?: string) =>
  useOfferTransition(offerApi.reject, id, asUserId);

export const useConfirmOffer = (id: string, asUserId?: string) =>
  useOfferTransition(offerApi.confirm, id, asUserId);

export const useReportOffer = (id: string, asUserId?: string) =>
  useMutation({
    mutationFn: () => offerApi.report(id, asUserId),
  });

/**
 * Маскированные предпочтения владельца целевого лота (для гейтинга чекбоксов).
 * Чужие предпочтения меняются без нашего ведома, поэтому при каждом открытии
 * модалки перезапрашиваем их заново (кэш показывается мгновенно, пока идёт
 * фоновый запрос).
 */
export const useLotOwnerAvailability = (lotId: string | undefined) => {
  return useQuery({
    queryKey: offerKeys.availability(lotId ?? 'none'),
    queryFn: () => offerApi.getAvailabilityForLot(lotId!),
    enabled: Boolean(lotId),
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export const useCreateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateOfferDto) => offerApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerKeys.all() });
      // Целевой лот сразу исчезает из ленты — сервер скрывает лоты
      // с активным предложением от этого пользователя.
      queryClient.invalidateQueries({ queryKey: lotKeys.lists() });
    },
    onError: (_error, dto) => {
      // Сервер мог отклонить по устаревшим предпочтениям получателя —
      // обновляем гейтинг чекбоксов в открытой модалке.
      queryClient.invalidateQueries({
        queryKey: offerKeys.availability(dto.lotId),
      });
    },
  });
};
