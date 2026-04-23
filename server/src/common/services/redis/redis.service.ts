import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from '@redis/client';
import { DataSource } from 'typeorm';
import { SessionEntity } from '@/database/entities/session.entity';
import { redisLogger } from '@/common/services/logger/logger.scopes';
import type { RedisSession } from '@/common/interfaces/redis-session.interface';

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

    redisLogger.info('Redis connected');
    await this.bootstrapSessions();
  }

  getClient(): RedisClientType {
    if (!this.client.isOpen) {
      redisLogger.error('Redis client not connected');
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  // Подсервис валидации сессий клиентов
  private async bootstrapSessions() {
    const client = this.getClient();

    redisLogger.info('Bootstrapping active sessions from DB...');

    const now = new Date();

    const sessions = await this.dataSource
      .getRepository(SessionEntity)
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .where('session.status = :status', { status: true })
      .andWhere('session.expiresAt > :now', { now })
      .getMany();

    redisLogger.info(`Found ${sessions.length} active sessions`);

    for (const session of sessions) {
      const ttlSeconds = Math.floor(
        (session.expiresAt.getTime() - Date.now()) / 1000,
      );

      if (ttlSeconds <= 0) continue;

      const data: RedisSession = {
        userId: session.user.id,
        active: true,
        expiresAt: session.expiresAt.getTime(),
      };

      await client.set(`session:${session.id}`, JSON.stringify(data), {
        EX: ttlSeconds,
      });
    }

    redisLogger.info('Session bootstrap completed');
  }

  async onModuleDestroy() {
    if (this.client.isOpen) {
      redisLogger.info('Closing Redis connection');
      await this.client.quit();
    }
  }
}
