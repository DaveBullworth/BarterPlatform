import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '@/common/services/redis/redis.service';
import { createHash } from 'crypto';
import { SecurityErrorCode } from '../errors/auth-error-codes';

@Injectable()
export class LoginBruteforcePolicy {
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW = 15 * 60; // 15 минут

  constructor(private readonly redisService: RedisService) {}

  private key(loginOrEmail: string): string {
    const hash = createHash('sha256')
      .update(loginOrEmail.toLowerCase())
      .digest('hex');

    return `bf:login:${hash}`;
  }

  async assertCanTry(loginOrEmail: string): Promise<void> {
    const redis = this.redisService.getClient();
    const key = this.key(loginOrEmail);

    const attempts = await redis.get(key);

    if (attempts && Number(attempts) >= this.MAX_ATTEMPTS) {
      throw new HttpException(
        { code: SecurityErrorCode.LOGIN_RATE_LIMIT },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async registerFailure(loginOrEmail: string): Promise<void> {
    const redis = this.redisService.getClient();
    const key = this.key(loginOrEmail);

    const attempts = await redis.incr(key);

    if (attempts === 1) {
      await redis.expire(key, this.WINDOW);
    }
  }

  async reset(loginOrEmail: string): Promise<void> {
    const redis = this.redisService.getClient();
    await redis.del(this.key(loginOrEmail));
  }
}
