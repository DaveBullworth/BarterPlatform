import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '@/common/services/redis/redis.service';
import { createHash } from 'crypto';
import { SecurityErrorCode } from '../errors/auth-error-codes';
import { redisLogger } from '@/common/services/logger/logger.scopes';

@Injectable()
export class LoginBruteforcePolicy {
  /**
   * Пороговые значения
   */
  private readonly DEVICE_MAX_ATTEMPTS = 5;
  private readonly DEVICE_WINDOW = 15 * 60; // 15 минут

  private readonly IP_MAX_ATTEMPTS = 20;
  private readonly IP_WINDOW = 15 * 60; // 15 минут

  private readonly TARGET_MAX_ATTEMPTS = 100;
  private readonly TARGET_WINDOW = 60 * 60; // 1 час

  constructor(private readonly redisService: RedisService) {}

  /**
   * =========================
   * Key helpers
   * =========================
   */

  private targetKey(loginOrEmail: string): string {
    const hash = createHash('sha256')
      .update(loginOrEmail.toLowerCase())
      .digest('hex');

    return `bf:login:target:${hash}`;
  }

  private deviceKey(deviceId: string): string {
    return `bf:login:device:${deviceId}`;
  }

  private ipKey(ip: string): string {
    return `bf:login:ip:${ip}`;
  }

  /**
   * =========================
   * Public API
   * =========================
   */

  async assertCanTry(params: {
    loginOrEmail: string;
    deviceId?: string;
    ip?: string;
  }): Promise<void> {
    const redis = this.redisService.getClient();

    const bfErrorPayload = {
      code: SecurityErrorCode.LOGIN_RATE_LIMIT,
      // ← флаг того что это не просто rate-limit а брутфорс
      meta: { isBruteforce: true },
    };

    if (params.deviceId) {
      const attempts = await redis.get(this.deviceKey(params.deviceId));
      if (attempts && Number(attempts) >= this.DEVICE_MAX_ATTEMPTS) {
        redisLogger.warn('Login rate limit hit (device)', {
          deviceId: params.deviceId,
        });

        throw new HttpException(bfErrorPayload, HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    if (params.ip) {
      const attempts = await redis.get(this.ipKey(params.ip));
      if (attempts && Number(attempts) >= this.IP_MAX_ATTEMPTS) {
        redisLogger.warn('Login rate limit hit (ip)', {
          ip: params.ip,
        });

        throw new HttpException(bfErrorPayload, HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    const targetAttempts = await redis.get(this.targetKey(params.loginOrEmail));

    if (targetAttempts && Number(targetAttempts) >= this.TARGET_MAX_ATTEMPTS) {
      redisLogger.error('Distributed brute force detected (target)', {
        loginHash: this.targetKey(params.loginOrEmail),
      });

      throw new HttpException(bfErrorPayload, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async registerFailure(params: {
    loginOrEmail: string;
    deviceId?: string;
    ip?: string;
  }): Promise<void> {
    const redis = this.redisService.getClient();

    if (params.deviceId) {
      const attempts = await redis.incr(this.deviceKey(params.deviceId));
      if (attempts === 1) {
        await redis.expire(this.deviceKey(params.deviceId), this.DEVICE_WINDOW);
      }
    }

    if (params.ip) {
      const attempts = await redis.incr(this.ipKey(params.ip));
      if (attempts === 1) {
        await redis.expire(this.ipKey(params.ip), this.IP_WINDOW);
      }
    }

    const targetAttempts = await redis.incr(
      this.targetKey(params.loginOrEmail),
    );
    if (targetAttempts === 1) {
      await redis.expire(
        this.targetKey(params.loginOrEmail),
        this.TARGET_WINDOW,
      );
    }
  }

  /**
   * Сбрасываем ТОЛЬКО device + ip
   * target — не трогаем
   */
  async reset(params: { deviceId?: string; ip?: string }): Promise<void> {
    const redis = this.redisService.getClient();

    if (params.deviceId) {
      await redis.del(this.deviceKey(params.deviceId));
    }

    if (params.ip) {
      await redis.del(this.ipKey(params.ip));
    }
  }
}
