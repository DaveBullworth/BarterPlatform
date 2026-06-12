// Типы и схемы
export {
  OFFER_STATUS,
  OFFER_ROLE,
  DEFAULT_OFFER_STATUS_FILTER,
  MAX_OFFERED_LOTS,
  OfferSchema,
  OfferLotSummarySchema,
  OfferFeedItemSchema,
  OffersFeedSchema,
  OfferDetailSchema,
  OfferCounterpartSchema,
  OfferActionsSchema,
  PreferenceAvailabilitySchema,
  CreateOfferSchema,
  type Offer,
  type OfferStatus,
  type OfferRole,
  type OfferLotSummary,
  type OfferFeedItem,
  type OffersFeed,
  type OfferDetail,
  type OfferActions,
  type PreferenceAvailability,
  type CreateOfferDto,
} from './model';

// Утилиты
export { isLotOfferable } from './lib';

// API / хуки
export {
  offerApi,
  offerKeys,
  useLotOwnerAvailability,
  useCreateOffer,
  useOffersFeed,
  useOffer,
  useAcceptOffer,
  useRejectOffer,
  useConfirmOffer,
  useReportOffer,
  type OffersFeedParams,
} from './api';
