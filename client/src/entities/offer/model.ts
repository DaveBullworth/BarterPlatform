import { z } from 'zod';
import { enumFromObject } from '@/shared/lib';

export const OFFER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const;

export type OfferStatus = (typeof OFFER_STATUS)[keyof typeof OFFER_STATUS];

export const OfferSchema = z.object({
  id: z.uuid(),
  proposerId: z.uuid(),
  recipientId: z.uuid(),
  lotId: z.uuid(),
  offeredLotIds: z.array(z.uuid()),
  status: enumFromObject(OFFER_STATUS),
  proposerCompletionConfirmed: z.boolean(),
  recipientCompletionConfirmed: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Offer = z.infer<typeof OfferSchema>;

/** Маскированные предпочтения владельца лота — только факт интереса, без весов. */
export const PreferenceAvailabilitySchema = z.object({
  chapterIds: z.array(z.number().int()),
  categoryIds: z.array(z.number().int()),
  subcategoryIds: z.array(z.number().int()),
});

export type PreferenceAvailability = z.infer<
  typeof PreferenceAvailabilitySchema
>;

export const MAX_OFFERED_LOTS = 5;

export const CreateOfferSchema = z.object({
  lotId: z.uuid(),
  offeredLotIds: z.array(z.uuid()).min(1).max(MAX_OFFERED_LOTS),
});

export type CreateOfferDto = z.infer<typeof CreateOfferSchema>;
