import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NotificationEntity } from '@/database/entities/notification.entity';
import { NotificationsRealtimeService } from './notifications.realtime.service';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationListResponseDto } from './dto/notification-list-response.dto';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import {
  CreateNotificationInput,
  NOTIFICATION_SUBTYPE_TYPE,
} from './notification.types';
import { NotificationErrorCode } from './errors/notifications-error-codes';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
    private readonly realtime: NotificationsRealtimeService,
  ) {}

  /**
   * Создаёт уведомление и пушит его в real-time. Вызывается ДРУГИМИ модулями
   * (offers, chat, moderation), не клиентом. `type` выводится из `subtype`.
   */
  async create(
    input: CreateNotificationInput,
  ): Promise<NotificationResponseDto> {
    const entity = this.repo.create({
      userId: input.userId,
      type: NOTIFICATION_SUBTYPE_TYPE[input.subtype],
      subtype: input.subtype,
      payload: input.payload ?? {},
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      isRead: false,
    });

    const dto = this.toDto(await this.repo.save(entity));

    // Real-time — best-effort: падение Redis/стрима не должно ронять создание.
    try {
      await this.realtime.publish(input.userId, {
        kind: 'notification:new',
        notification: dto,
      });
    } catch (err) {
      this.logger.warn(`Realtime publish failed: ${String(err)}`);
    }
    await this.emitUnread(input.userId);

    return dto;
  }

  /**
   * Fire-and-forget обёртка над create(): НИКОГДА не бросает и не требует await.
   * Ради этого в сервисах-продюсерах уведомление — это одна строка без try/catch:
   *   this.notifications.emit(notificationBuilders.offerAccepted({...}));
   */
  emit(input: CreateNotificationInput): void {
    void this.create(input).catch((err) =>
      this.logger.warn(
        `Notification emit failed (${input.subtype}): ${String(err)}`,
      ),
    );
  }

  async findForUser(
    userId: string,
    query: GetNotificationsQueryDto,
  ): Promise<NotificationListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.repo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId });

    if (query.onlyUnread) {
      qb.andWhere('n.isRead = false');
    }

    qb.orderBy('n.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();
    const unreadCount = await this.getUnreadCount(userId);

    return { data: rows.map((row) => this.toDto(row)), total, unreadCount };
  }

  getUnreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async markRead(id: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.repo.findOne({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException({
        code: NotificationErrorCode.NOTIFICATION_NOT_FOUND,
        message: 'Notification not found',
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.repo.save(notification);
      await this.emitUnread(userId);
    }

    return this.toDto(notification);
  }

  async markAllRead(userId: string): Promise<{ success: true }> {
    await this.repo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    await this.emitUnread(userId);
    return { success: true };
  }

  private async emitUnread(userId: string): Promise<void> {
    try {
      const unreadCount = await this.getUnreadCount(userId);
      await this.realtime.publish(userId, {
        kind: 'notification:unread',
        unreadCount,
      });
    } catch (err) {
      this.logger.warn(`Unread emit failed: ${String(err)}`);
    }
  }

  private toDto(n: NotificationEntity): NotificationResponseDto {
    return {
      id: n.id,
      type: n.type,
      subtype: n.subtype,
      payload: n.payload ?? {},
      entityType: n.entityType,
      entityId: n.entityId,
      isRead: n.isRead,
      readAt: n.readAt,
      createdAt: n.createdAt,
    };
  }
}
