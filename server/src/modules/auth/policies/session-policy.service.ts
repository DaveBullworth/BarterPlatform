import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';

import { SessionEntity } from '@/database/entities/session.entity';
import { RedisSessionService } from '@/common/services/redis/redis.session';
import { NotificationsService } from '../../notifications/notifications.service';
import { notificationBuilders } from '../../notifications/notification.builders';

@Injectable()
export class SessionPolicyService {
  /**
   * Максимальное количество одновременных активных сессий
   * для одного пользователя.
   *
   * Это бизнес-правило, не инфраструктура.
   */
  private readonly MAX_SESSIONS = Number(process.env.MAX_SESSIONS) || 3;

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    private readonly redisSessionService: RedisSessionService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Гасит сессию: помечает неактивной в БД и удаляет ключ из Redis.
   * Единая точка отзыва — переиспользуется логаутом, вытеснением и ручным
   * завершением сессий.
   */
  async revoke(session: SessionEntity): Promise<void> {
    session.status = false;
    session.refreshTokenHash = null;
    await this.sessionRepo.save(session);
    await this.redisSessionService.revokeSession(session.id);
  }

  /**
   * Лениво закрывает «мёртвые» сессии пользователя: те, что ещё помечены
   * активными, но у которых истёк expiresAt. Без этого протухшие сессии
   * (закрытая вкладка, очищенные cookie) бесконечно занимали бы лимит и
   * блокировали вход.
   */
  async cleanupExpired(userId: string): Promise<void> {
    const expired = await this.sessionRepo.find({
      where: {
        user: { id: userId },
        status: true,
        expiresAt: LessThanOrEqual(new Date()),
      },
    });

    for (const session of expired) {
      await this.revoke(session);
    }
  }

  /**
   * Гарантирует, что пользователь сможет создать новую сессию, не упираясь в
   * лимит: сначала чистит протухшие, затем — если живых сессий всё ещё столько
   * же или больше лимита — вытесняет самые старые (по последней активности).
   * Вытесненное устройство получает security-уведомление.
   *
   * Стратегия «скользящего окна»: вход доступен всегда, лимит ограничивает лишь
   * число одновременно живых устройств.
   */
  async enforceSessionLimit(userId: string): Promise<void> {
    await this.cleanupExpired(userId);

    const active = await this.sessionRepo.find({
      where: {
        user: { id: userId },
        status: true,
        expiresAt: MoreThan(new Date()),
      },
      // Вытесняем самые старые по дате создания — детерминированно и без
      // зависимости от NULL в lastSeenAt (легаси-строки до миграции).
      order: { createdAt: 'ASC' },
    });

    // Освобождаем место под одну новую сессию.
    const toEvict = active.length - this.MAX_SESSIONS + 1;

    for (let i = 0; i < toEvict; i++) {
      const session = active[i];
      await this.revoke(session);

      this.notificationsService.emit(
        notificationBuilders.sessionTerminated({
          userId,
          ip: session.ip,
          userAgent: session.userAgent,
        }),
      );
    }
  }
}
