import {
  NotificationEntityType,
  NotificationSubtype,
} from '@/database/entities/notification.entity';
import { CreateNotificationInput } from './notification.types';

/**
 * Билдеры уведомлений — единственное место, где живёт «контракт» каждого
 * уведомления: получатель + subtype + привязка к сущности + ключи payload
 * (под i18n на клиенте). Сервисы-продюсеры зовут их в одну строку через
 * notificationsService.emit(...), не зная деталей хранения.
 */
export const notificationBuilders = {
  // ───────── exchange ─────────
  offerReceived: (p: {
    recipientId: string;
    offerId: string;
    lotTitle: string;
    offeredCount: number;
  }): CreateNotificationInput => ({
    userId: p.recipientId,
    subtype: NotificationSubtype.OFFER_RECEIVED,
    entityType: NotificationEntityType.OFFER,
    entityId: p.offerId,
    payload: { lotTitle: p.lotTitle, offeredCount: p.offeredCount },
  }),

  offerAccepted: (p: {
    proposerId: string;
    offerId: string;
  }): CreateNotificationInput => ({
    userId: p.proposerId,
    subtype: NotificationSubtype.OFFER_ACCEPTED,
    entityType: NotificationEntityType.OFFER,
    entityId: p.offerId,
  }),

  offerRejected: (p: {
    userId: string;
    offerId: string;
  }): CreateNotificationInput => ({
    userId: p.userId,
    subtype: NotificationSubtype.OFFER_REJECTED,
    entityType: NotificationEntityType.OFFER,
    entityId: p.offerId,
  }),

  offerCompleted: (p: {
    userId: string;
    offerId: string;
  }): CreateNotificationInput => ({
    userId: p.userId,
    subtype: NotificationSubtype.OFFER_COMPLETED,
    entityType: NotificationEntityType.OFFER,
    entityId: p.offerId,
  }),

  // ───────── account ─────────
  accountDeactivated: (userId: string): CreateNotificationInput => ({
    userId,
    subtype: NotificationSubtype.ACCOUNT_DEACTIVATED,
  }),

  accountReactivated: (userId: string): CreateNotificationInput => ({
    userId,
    subtype: NotificationSubtype.ACCOUNT_REACTIVATED,
  }),

  roleChanged: (p: {
    userId: string;
    role: string;
  }): CreateNotificationInput => ({
    userId: p.userId,
    subtype: NotificationSubtype.ROLE_CHANGED,
    payload: { role: p.role },
  }),

  // ───────── security ─────────
  newLogin: (p: {
    userId: string;
    ip?: string | null;
    deviceId?: string | null;
    userAgent?: string | null;
  }): CreateNotificationInput => ({
    userId: p.userId,
    subtype: NotificationSubtype.NEW_LOGIN,
    payload: {
      ip: p.ip ?? null,
      deviceId: p.deviceId ?? null,
      userAgent: p.userAgent ?? null,
    },
  }),

  passwordChanged: (userId: string): CreateNotificationInput => ({
    userId,
    subtype: NotificationSubtype.PASSWORD_CHANGED,
  }),

  // Старая сессия завершена автоматически при входе с нового устройства
  // (достигнут лимит одновременных сессий).
  sessionTerminated: (p: {
    userId: string;
    ip?: string | null;
    userAgent?: string | null;
  }): CreateNotificationInput => ({
    userId: p.userId,
    subtype: NotificationSubtype.SESSION_TERMINATED,
    payload: {
      ip: p.ip ?? null,
      userAgent: p.userAgent ?? null,
    },
  }),

  // Жалоба на предложение — уведомление администратору (по одному на каждого).
  offerReported: (p: {
    adminId: string;
    offerId: string;
    reporterId: string;
  }): CreateNotificationInput => ({
    userId: p.adminId,
    subtype: NotificationSubtype.OFFER_REPORTED,
    entityType: NotificationEntityType.OFFER,
    entityId: p.offerId,
    payload: { reporterId: p.reporterId },
  }),

  // ───────── lots / moderation ─────────
  lotModerated: (p: {
    userId: string;
    lotId: string;
    lotTitle: string;
    status: string;
  }): CreateNotificationInput => ({
    userId: p.userId,
    subtype: NotificationSubtype.LOT_DEACTIVATED,
    entityType: NotificationEntityType.LOT,
    entityId: p.lotId,
    payload: { lotTitle: p.lotTitle, status: p.status },
  }),

  lotRemoved: (p: {
    userId: string;
    lotId: string;
    lotTitle: string;
  }): CreateNotificationInput => ({
    userId: p.userId,
    subtype: NotificationSubtype.LOT_REMOVED,
    entityType: NotificationEntityType.LOT,
    entityId: p.lotId,
    payload: { lotTitle: p.lotTitle },
  }),

  lotDeletionScheduled: (p: {
    userId: string;
    lotId: string;
    lotTitle: string;
    daysLeft: number;
  }): CreateNotificationInput => ({
    userId: p.userId,
    subtype: NotificationSubtype.LOT_DELETION_SCHEDULED,
    entityType: NotificationEntityType.LOT,
    entityId: p.lotId,
    payload: { lotTitle: p.lotTitle, daysLeft: p.daysLeft },
  }),

  // ───────── chat ─────────
  // Диалог привязан к офферу, поэтому deep-link ведёт на страницу предложения
  // (entityType OFFER), где открывается чат. Коалесцируется по entityId в
  // NotificationsService.emitChatMessage — одно уведомление на оффер.
  chatMessage: (p: {
    recipientId: string;
    offerId: string;
    senderName: string;
    preview: string;
  }): CreateNotificationInput => ({
    userId: p.recipientId,
    subtype: NotificationSubtype.CHAT_MESSAGE,
    entityType: NotificationEntityType.OFFER,
    entityId: p.offerId,
    payload: { senderName: p.senderName, preview: p.preview },
  }),
};
