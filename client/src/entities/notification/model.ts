import { z } from 'zod';

export const NOTIFICATION_TYPE = {
  SYSTEM: 'system',
  EXCHANGE: 'exchange',
  CHAT: 'chat',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

/** entityType с сервера — к какой сущности привязан deep-link уведомления. */
export const NOTIFICATION_ENTITY_TYPE = {
  OFFER: 'offer',
  LOT: 'lot',
} as const;

/** Подтипы с особой логикой перехода. */
export const NOTIFICATION_SUBTYPE = {
  /** Жалоба на предложение — админ открывает его от лица отправителя жалобы. */
  OFFER_REPORTED: 'system.offer_reported',
  /** Лот удалён — переходить некуда. */
  LOT_REMOVED: 'system.lot_removed',
} as const;

// subtype приходит строкой (varchar на бэке) — он же якорь i18n-ключа на клиенте.
export const NotificationSchema = z.object({
  id: z.uuid(),
  type: z.string(),
  subtype: z.string(),
  payload: z.record(z.string(), z.unknown()).default({}),
  entityType: z.string().nullable(),
  entityId: z.string().nullable(),
  isRead: z.boolean(),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationListSchema = z.object({
  data: z.array(NotificationSchema),
  total: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
});

export type NotificationList = z.infer<typeof NotificationListSchema>;

export const UnreadCountSchema = z.object({
  count: z.number().int().nonnegative(),
});
