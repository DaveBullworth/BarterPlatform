import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '@/common/services/redis/redis.service';
import { createHash } from 'crypto';
import { SecurityErrorCode } from '@/modules/auth/errors/auth-error-codes';

@Injectable()
export class DeactivationPolicy {
  private readonly MAX_ATTEMPTS = 3;
  private readonly WINDOW = 24 * 60 * 60; // сутки

  constructor(private readonly redisService: RedisService) {}

  private key(userId: string): string {
    const hash = createHash('sha256')
      .update(userId.toLowerCase())
      .digest('hex');

    return `bf:deactivation:${hash}`;
  }

  async assertCanRequest(userId: string): Promise<void> {
    const redis = this.redisService.getClient();
    const attempts = await redis.get(this.key(userId));

    if (attempts && Number(attempts) >= this.MAX_ATTEMPTS) {
      throw new HttpException(
        { code: SecurityErrorCode.DEACTIVATION_RATE_LIMIT },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async registerRequest(userId: string): Promise<void> {
    const redis = this.redisService.getClient();
    const key = this.key(userId);

    const attempts = await redis.incr(key);

    if (attempts === 1) {
      await redis.expire(key, this.WINDOW);
    }
  }
}
