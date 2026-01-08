import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from '@redis/client';
import type { RedisSession } from '@/common/interfaces/redis-session.interface';
import { redisLogger } from '@/common/services/logger/logger.scopes';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClientType;

  async onModuleInit() {
    // Лог подключения
    redisLogger.info('Connecting to Redis...', {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    });

    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'redis',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      redisLogger.info('Redis socket connected');
    });

    this.client.on('ready', () => {
      redisLogger.info('Redis client ready');
    });

    this.client.on('reconnecting', () => {
      redisLogger.warn('Redis reconnecting');
    });

    this.client.on('error', (err: unknown) => {
      if (err instanceof Error) {
        redisLogger.error('Redis client error', {
          error: err.message,
          stack: err.stack,
        });
      } else {
        redisLogger.error('Redis client error (non-Error)', {
          error: String(err),
        });
      }
    });

    await this.client.connect();
  }

  getClient(): RedisClientType {
    if (!this.client.isOpen) {
      redisLogger.error('Redis client not connected');
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  async setSession(sessionId: string, data: RedisSession, ttlSeconds: number) {
    const client = this.getClient();

    redisLogger.debug('SET session', {
      sid: sessionId,
      ttl: ttlSeconds,
    });

    await client.set(`session:${sessionId}`, JSON.stringify(data), {
      EX: ttlSeconds,
    });
  }

  async getSession(sessionId: string): Promise<RedisSession | null> {
    const client = this.getClient();

    if (!sessionId) {
      redisLogger.warn('GET session called without sid');
      return null;
    }

    redisLogger.debug('GET session', { sid: sessionId });

    const raw = await client.get(`session:${sessionId}`);

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
    const client = this.getClient();

    redisLogger.info('REVOKE session', { sid: sessionId });

    await client.del(`session:${sessionId}`);
  }

  async onModuleDestroy() {
    if (this.client.isOpen) {
      redisLogger.info('Closing Redis connection');
      await this.client.quit();
    }
  }
}
