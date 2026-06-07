import {
  Injectable,
  Logger,
  type MessageEvent,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { RedisClientType } from '@redis/client';
import { Observable, Subject, filter, map } from 'rxjs';

import { RedisService } from '@/common/services/redis/redis.service';
import { NotificationStreamEvent } from './notification.types';

const CHANNEL_PREFIX = 'notif:user:';
const CHANNEL_PATTERN = `${CHANNEL_PREFIX}*`;

/**
 * Транспорт real-time уведомлений. Изолирован от доменной логики: домен зовёт
 * publish(), а как это доезжает до клиента (SSE/WS/иное) — деталь этого слоя.
 *
 * Fan-out через Redis pub/sub: publish() кладёт событие в канал пользователя,
 * единый subscriber (отдельное соединение, как требует node-redis) ловит его на
 * ЛЮБОМ инстансе и проталкивает в локальную RxJS-шину, из которой читают
 * открытые на этом инстансе SSE-стримы.
 */
@Injectable()
export class NotificationsRealtimeService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationsRealtimeService.name);
  private subscriber: RedisClientType | null = null;
  private readonly bus = new Subject<{
    userId: string;
    event: NotificationStreamEvent;
  }>();

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit(): Promise<void> {
    this.subscriber = this.redisService.getClient().duplicate();
    this.subscriber.on('error', (err) =>
      this.logger.error(`Notifications subscriber error: ${String(err)}`),
    );
    await this.subscriber.connect();

    await this.subscriber.pSubscribe(CHANNEL_PATTERN, (message, channel) => {
      const userId = channel.slice(CHANNEL_PREFIX.length);
      try {
        const event = JSON.parse(message) as NotificationStreamEvent;
        this.bus.next({ userId, event });
      } catch (err) {
        this.logger.warn(
          `Dropping malformed notification on ${channel}: ${String(err)}`,
        );
      }
    });

    this.logger.log('Notifications realtime subscriber ready');
  }

  /** Публикует событие — долетит до всех инстансов, где открыт стрим юзера. */
  async publish(userId: string, event: NotificationStreamEvent): Promise<void> {
    await this.redisService
      .getClient()
      .publish(`${CHANNEL_PREFIX}${userId}`, JSON.stringify(event));
  }

  /** SSE-поток конкретного пользователя. */
  streamForUser(userId: string): Observable<MessageEvent> {
    return this.bus.asObservable().pipe(
      filter((e) => e.userId === userId),
      map((e) => ({ data: e.event }) as MessageEvent),
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.bus.complete();
    if (this.subscriber?.isOpen) {
      await this.subscriber.quit();
    }
  }
}
