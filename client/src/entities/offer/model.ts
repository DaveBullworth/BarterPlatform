import { z } from 'zod';
import { enumFromObject } from '@/shared/lib';
import { LotResponseSchema } from '@/entities/lot';

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

// ── Лента предложений ───────────────────────────────────────────────

export const OFFER_ROLE = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
} as const;

export type OfferRole = (typeof OFFER_ROLE)[keyof typeof OFFER_ROLE];

/** Статусы, показываемые по умолчанию (все, кроме завершённых и отклонённых). */
export const DEFAULT_OFFER_STATUS_FILTER: OfferStatus[] = [
  OFFER_STATUS.PENDING,
  OFFER_STATUS.ACCEPTED,
];

export const OfferLotSummarySchema = z.object({
  id: z.uuid(),
  generalDescription: z.string(),
  chapterId: z.number().int(),
});

export type OfferLotSummary = z.infer<typeof OfferLotSummarySchema>;

export const OfferFeedItemSchema = z.object({
  id: z.uuid(),
  status: enumFromObject(OFFER_STATUS),
  role: enumFromObject(OFFER_ROLE),
  counterpartId: z.uuid(),
  targetLot: OfferLotSummarySchema.nullable(),
  offeredLots: z.array(OfferLotSummarySchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type OfferFeedItem = z.infer<typeof OfferFeedItemSchema>;

export const OffersFeedSchema = z.object({
  data: z.array(OfferFeedItemSchema),
  total: z.number().int().nonnegative(),
});

export type OffersFeed = z.infer<typeof OffersFeedSchema>;

// ── Детальная карточка предложения ──────────────────────────────────

export const OfferCounterpartSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const OfferActionsSchema = z.object({
  canAccept: z.boolean(),
  canReject: z.boolean(),
  canConfirm: z.boolean(),
});

export type OfferActions = z.infer<typeof OfferActionsSchema>;

export const OfferDetailSchema = z.object({
  id: z.uuid(),
  status: enumFromObject(OFFER_STATUS),
  role: enumFromObject(OFFER_ROLE),
  counterpart: OfferCounterpartSchema,
  targetLot: LotResponseSchema.nullable(),
  offeredLots: z.array(LotResponseSchema),
  proposerCompletionConfirmed: z.boolean(),
  recipientCompletionConfirmed: z.boolean(),
  viewerConfirmed: z.boolean(),
  actions: OfferActionsSchema,
  createdAt: z.iso.datetime(),
  acceptedAt: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  rejectedAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime(),
});

export type OfferDetail = z.infer<typeof OfferDetailSchema>;
