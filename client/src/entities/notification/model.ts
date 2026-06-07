import { z } from 'zod';

export const NOTIFICATION_TYPE = {
  SYSTEM: 'system',
  EXCHANGE: 'exchange',
  CHAT: 'chat',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

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
