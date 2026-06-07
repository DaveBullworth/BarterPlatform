import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { $authHost } from '@/shared/api';
import {
  OfferSchema,
  PreferenceAvailabilitySchema,
  type CreateOfferDto,
  type Offer,
  type PreferenceAvailability,
} from './model';

export const offerKeys = {
  all: () => ['offers'] as const,
  availability: (lotId: string) =>
    [...offerKeys.all(), 'availability', lotId] as const,
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
};

/** Маскированные предпочтения владельца целевого лота (для гейтинга чекбоксов). */
export const useLotOwnerAvailability = (lotId: string | undefined) => {
  return useQuery({
    queryKey: offerKeys.availability(lotId ?? 'none'),
    queryFn: () => offerApi.getAvailabilityForLot(lotId!),
    enabled: Boolean(lotId),
    staleTime: 1000 * 60,
  });
};

export const useCreateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateOfferDto) => offerApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerKeys.all() });
    },
  });
};
