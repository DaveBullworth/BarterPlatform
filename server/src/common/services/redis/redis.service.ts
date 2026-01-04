import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from '@redis/client';
import type { RedisSession } from '@/common/interfaces/redis-session.interface';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClientType;

  async onModuleInit() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'redis',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    await this.client.connect();
  }

  getClient(): RedisClientType {
    if (!this.client.isOpen) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  async setSession(sessionId: string, data: RedisSession, ttlSeconds: number) {
    const client = this.getClient();
    await client.set(`session:${sessionId}`, JSON.stringify(data), {
      EX: ttlSeconds,
    });
  }

  async getSession(sessionId: string): Promise<RedisSession | null> {
    const client = this.getClient();
    const raw = await client.get(`session:${sessionId}`);

    if (!raw) return null;

    try {
      const parsed: unknown = JSON.parse(raw);

      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'userId' in parsed &&
        'active' in parsed &&
        'expiresAt' in parsed
      ) {
        return parsed as RedisSession;
      }

      return null;
    } catch {
      return null;
    }
  }

  async revokeSession(sessionId: string) {
    const client = this.getClient();
    await client.del(`session:${sessionId}`);
  }

  async onModuleDestroy() {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}
