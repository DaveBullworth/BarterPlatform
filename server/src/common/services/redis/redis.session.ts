import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { redisLogger } from '@/common/services/logger/logger.scopes';
import type { RedisSession } from '@/common/interfaces/redis-session.interface';

@Injectable()
export class RedisSessionService {
  private static readonly SESSION_KEY_PREFIX = 'session:';

  constructor(private readonly redis: RedisService) {}

  // Подсервис управления сессиями пользователей (хранение в Redis, TTL, удаление при выходе и т.п.)

  private getKey(sessionId: string) {
    return `${RedisSessionService.SESSION_KEY_PREFIX}${sessionId}`;
  }

  async setSession(sessionId: string, data: RedisSession, ttlSeconds: number) {
    const client = this.redis.getClient();

    redisLogger.debug('SET session', {
      sid: sessionId,
      ttl: ttlSeconds,
    });

    await client.set(this.getKey(sessionId), JSON.stringify(data), {
      EX: ttlSeconds,
    });
  }

  async getSession(sessionId: string): Promise<RedisSession | null> {
    const client = this.redis.getClient();

    if (!sessionId) {
      redisLogger.warn('GET session called without sid');
      return null;
    }

    redisLogger.debug('GET session', { sid: sessionId });

    const raw = await client.get(this.getKey(sessionId));

    if (!raw) {
      redisLogger.debug('MISS session', { sid: sessionId });
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);

      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'userId' in parsed &&
        'active' in parsed &&
        'expiresAt' in parsed
      ) {
        redisLogger.debug('HIT session', { sid: sessionId });
        return parsed as RedisSession;
      }

      redisLogger.warn('Invalid session payload', {
        sid: sessionId,
        raw,
      });

      return null;
    } catch (err) {
      redisLogger.error('Failed to parse session JSON', {
        sid: sessionId,
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  async revokeSession(sessionId: string) {
    const client = this.redis.getClient();

    redisLogger.info('REVOKE session', { sid: sessionId });

    await client.del(this.getKey(sessionId));
  }
}
