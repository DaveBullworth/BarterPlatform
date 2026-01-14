import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '@/common/services/redis/redis.service';
import { createHash } from 'crypto';
import { SecurityErrorCode } from '@/modules/auth/errors/auth-error-codes';

@Injectable()
export class PasswordResetPolicy {
  private readonly MAX_ATTEMPTS = 3;
  private readonly WINDOW = 24 * 60 * 60; // 24 часа

  constructor(private readonly redisService: RedisService) {}

  private key(email: string): string {
    const hash = createHash('sha256').update(email.toLowerCase()).digest('hex');

    return `bf:password-reset:${hash}`;
  }

  async assertCanRequest(email: string): Promise<void> {
    const redis = this.redisService.getClient();
    const attempts = await redis.get(this.key(email));

    if (attempts && Number(attempts) >= this.MAX_ATTEMPTS) {
      throw new HttpException(
        { code: SecurityErrorCode.PASSWORD_RESET_RATE_LIMIT },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async registerRequest(email: string): Promise<void> {
    const redis = this.redisService.getClient();
    const key = this.key(email);

    const attempts = await redis.incr(key);

    if (attempts === 1) {
      await redis.expire(key, this.WINDOW);
    }
  }
}
