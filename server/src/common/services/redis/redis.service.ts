import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from '@redis/client';
import type { RedisSession } from '@/common/interfaces/redis-session.interface';
import { DataSource } from 'typeorm';
import { UserEntity } from '@/database/entities/user.entity';
import { redisLogger } from '@/common/services/logger/logger.scopes';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClientType;

  constructor(private readonly dataSource: DataSource) {}

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

    redisLogger.info('Redis connected, initializing user timestamps...');
    await this.initUserTimestamps(); // сразу вызываем инициализацию
  }

  getClient(): RedisClientType {
    if (!this.client.isOpen) {
      redisLogger.error('Redis client not connected');
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  // Подсервис валидации сессий клиентов

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

  // Подсервис валидации кеша записей

  async initUserTimestamps() {
    const repo = this.dataSource.getRepository(UserEntity);

    // Берём только id и updatedAt для экономии памяти
    const users = await repo.find({ select: ['id', 'updatedAt'] });
    redisLogger.info(`Initializing ${users.length} user timestamps in Redis`);

    const pipeline = this.client.multi(); // batch запись через pipeline

    users.forEach((user) => {
      // ключ формата "user:updated:{userId}" → timestamp
      pipeline.set(`user:updated:${user.id}`, user.updatedAt.toISOString());
    });

    await pipeline.exec();
    redisLogger.info('User timestamps initialized in Redis');
  }

  async updateUserTimestamp(userId: string, date?: Date) {
    const client = this.getClient();
    const updatedAt = (date ?? new Date()).toISOString();
    await client.set(`user:updated:${userId}`, updatedAt);
  }

  async deleteUserTimestamp(userId: string) {
    const client = this.getClient();
    await client.del(`user:updated:${userId}`);
  }

  async onModuleDestroy() {
    if (this.client.isOpen) {
      redisLogger.info('Closing Redis connection');
      await this.client.quit();
    }
  }
}
