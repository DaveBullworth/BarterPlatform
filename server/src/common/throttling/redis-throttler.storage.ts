import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

import { RedisService } from '@/common/services/redis/redis.service';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redis = this.redisService.getClient();
    const hitsKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `${hitsKey}:block`;

    const blockTtl = await redis.pTTL(blockKey);
    if (blockTtl > 0) {
      const totalHits = Number((await redis.get(hitsKey)) ?? limit + 1);
      const timeToExpire = Math.max(await redis.pTTL(hitsKey), 0);

      return {
        totalHits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: blockTtl,
      };
    }

    const totalHits = await redis.incr(hitsKey);
    if (totalHits === 1) {
      await redis.pExpire(hitsKey, ttl);
    }

    const timeToExpire = Math.max(await redis.pTTL(hitsKey), 0);

    if (totalHits > limit) {
      const effectiveBlockMs = blockDuration > 0 ? blockDuration : ttl;
      await redis.set(blockKey, '1', {
        PX: effectiveBlockMs,
        NX: true,
      });

      return {
        totalHits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: Math.max(await redis.pTTL(blockKey), 0),
      };
    }

    return {
      totalHits,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
