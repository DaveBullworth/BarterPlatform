import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Широкий канал уведомления (стабильный, маленький набор → PG enum). */
export enum NotificationType {
  SYSTEM = 'system',
  EXCHANGE = 'exchange',
  CHAT = 'chat',
}

/**
 * Конкретное событие. Значение в точечной нотации сразу служит якорем i18n-ключа
 * на клиенте: `notifications.exchange.offer_received.title|body`.
 *
 * Хранится как varchar (а не PG enum), чтобы добавлять новые виды уведомлений
 * без миграций enum-типа — набор будет активно расти.
 */
export enum NotificationSubtype {
  // system — аккаунт
  ADMIN_MESSAGE = 'system.admin_message',
  SUSPICIOUS_ACTIVITY = 'system.suspicious_activity',
  OFFER_REPORTED = 'system.offer_reported',
  ACCOUNT_DEACTIVATED = 'system.account_deactivated',
  ACCOUNT_REACTIVATED = 'system.account_reactivated',
  ROLE_CHANGED = 'system.role_changed',
  // system — безопасность
  NEW_LOGIN = 'system.new_login',
  PASSWORD_CHANGED = 'system.password_changed',
  SESSION_TERMINATED = 'system.session_terminated',
  // system — лоты / модерация
  LOT_DEACTIVATED = 'system.lot_deactivated',
  LOT_REMOVED = 'system.lot_removed',
  LOT_DELETION_SCHEDULED = 'system.lot_deletion_scheduled',
  // exchange
  OFFER_RECEIVED = 'exchange.offer_received',
  OFFER_ACCEPTED = 'exchange.offer_accepted',
  OFFER_REJECTED = 'exchange.offer_rejected',
  OFFER_COMPLETED = 'exchange.offer_completed',
  // chat
  CHAT_MESSAGE = 'chat.message_received',
}

/** Тип сущности, к которой привязано уведомление (для deep-link). */
export enum NotificationEntityType {
  OFFER = 'offer',
  LOT = 'lot',
  CHAT = 'chat',
  MESSAGE = 'message',
  USER = 'user',
}

@Entity('notifications')
@Index('IDX_notifications_user_read', ['userId', 'isRead'])
@Index('IDX_notifications_user_created', ['userId', 'createdAt'])
export class NotificationEntity {
  @ApiProperty({ example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Получатель уведомления',
  })
  @Column({ type: 'uuid' })
  userId!: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.EXCHANGE })
  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({
    example: NotificationSubtype.OFFER_RECEIVED,
    description: 'Конкретное событие; служит якорем i18n-ключа на клиенте',
  })
  @Column({ type: 'varchar' })
  subtype!: NotificationSubtype;

  /**
   * Язык-НЕЗАВИСИМЫЕ данные для интерполяции на клиенте: имена/логины, счётчики,
   * коды статусов (enum), доп. ссылки на сущности и т.п. Переведённый текст НЕ
   * храним — клиент рендерит строку через i18n по subtype + payload. Исключение —
   * пользовательский контент (например, текст сообщения от администрации).
   */
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { offeredCount: 3, lotTitle: 'MacBook Pro 14"' },
  })
  @Column({ type: 'jsonb', default: () => "'{}'" })
  payload!: Record<string, unknown>;

  @ApiPropertyOptional({
    enum: NotificationEntityType,
    nullable: true,
    description: 'Основная связанная сущность (для перехода по клику)',
  })
  @Column({ type: 'varchar', nullable: true })
  entityType!: NotificationEntityType | null;

  @ApiPropertyOptional({ nullable: true, description: 'ID связанной сущности' })
  @Column({ type: 'varchar', nullable: true })
  entityId!: string | null;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @ApiProperty({ example: '2026-06-06T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-06T12:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt!: Date;
}
