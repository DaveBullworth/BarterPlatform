import {
  NotificationEntityType,
  NotificationSubtype,
  NotificationType,
} from '@/database/entities/notification.entity';
import { NotificationResponseDto } from './dto/notification-response.dto';

/**
 * Единый источник правды: к какому типу относится каждый подтип. Сервис выводит
 * `type` из `subtype`, чтобы вызывающий код не мог их рассинхронизировать.
 */
export const NOTIFICATION_SUBTYPE_TYPE: Record<
  NotificationSubtype,
  NotificationType
> = {
  [NotificationSubtype.ADMIN_MESSAGE]: NotificationType.SYSTEM,
  [NotificationSubtype.SUSPICIOUS_ACTIVITY]: NotificationType.SYSTEM,
  [NotificationSubtype.OFFER_REPORTED]: NotificationType.SYSTEM,
  [NotificationSubtype.ACCOUNT_DEACTIVATED]: NotificationType.SYSTEM,
  [NotificationSubtype.ACCOUNT_REACTIVATED]: NotificationType.SYSTEM,
  [NotificationSubtype.ROLE_CHANGED]: NotificationType.SYSTEM,
  [NotificationSubtype.NEW_LOGIN]: NotificationType.SYSTEM,
  [NotificationSubtype.PASSWORD_CHANGED]: NotificationType.SYSTEM,
  [NotificationSubtype.SESSION_TERMINATED]: NotificationType.SYSTEM,
  [NotificationSubtype.LOT_DEACTIVATED]: NotificationType.SYSTEM,
  [NotificationSubtype.LOT_REMOVED]: NotificationType.SYSTEM,
  [NotificationSubtype.LOT_DELETION_SCHEDULED]: NotificationType.SYSTEM,
  [NotificationSubtype.OFFER_RECEIVED]: NotificationType.EXCHANGE,
  [NotificationSubtype.OFFER_ACCEPTED]: NotificationType.EXCHANGE,
  [NotificationSubtype.OFFER_REJECTED]: NotificationType.EXCHANGE,
  [NotificationSubtype.OFFER_COMPLETED]: NotificationType.EXCHANGE,
  [NotificationSubtype.CHAT_MESSAGE]: NotificationType.CHAT,
};

/** Вход для создания уведомления (вызывается другими модулями, не клиентом). */
export type CreateNotificationInput = {
  userId: string;
  subtype: NotificationSubtype;
  payload?: Record<string, unknown>;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
};

/** События, которые летят в SSE-стрим. */
export type NotificationStreamEvent =
  | { kind: 'notification:new'; notification: NotificationResponseDto }
  | { kind: 'notification:unread'; unreadCount: number }
  // Чат переиспользует тот же per-user SSE-канал, что и уведомления:
  // отдельное соединение не нужно. offerId служит идентификатором диалога.
  | { kind: 'chat:message'; offerId: string; messageId: string; senderId: string }
  | { kind: 'chat:read'; offerId: string; readerId: string }
  | { kind: 'chat:unread'; unreadCount: number }
  | { kind: 'ping' };
