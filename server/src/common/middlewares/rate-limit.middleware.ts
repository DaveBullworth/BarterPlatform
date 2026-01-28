// common/middlewares/rate-limit.middleware.ts
import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { RedisService } from '../services/redis/redis.service';
import { AppRequest } from '../interfaces/app-request.interface';
import { SecurityErrorCode } from '@/modules/auth/errors/auth-error-codes';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}

  private readonly HEAVY_LIMIT = 20; // Для тяжелых запросов
  private readonly CHEAP_LIMIT = 100; // Для легких запросов (проверка кеша)

  private readonly WINDOW = 5; // окно в секундах

  async use(req: AppRequest, res: Response, next: NextFunction) {
    const deviceId = req.cookies.device_id;
    if (!deviceId) return next(); // на всякий случай, хотя device_id всегда есть

    const isCacheCheck = Boolean(req.headers['if-user-updated-since']);

    const redis = this.redisService.getClient();

    const key = isCacheCheck
      ? `rate:cheap:${deviceId}`
      : `rate:dev:${deviceId}`;

    // Инкрементируем счётчик
    const requests = await redis.incr(key);

    if (requests === 1) {
      // Первый запрос, ставим TTL
      await redis.expire(key, this.WINDOW);
    }

    const limit = isCacheCheck ? this.CHEAP_LIMIT : this.HEAVY_LIMIT;

    if (requests > limit) {
      // Превышен лимит → 429
      throw new HttpException(
        { code: SecurityErrorCode.TOO_MANY_REQUESTS },
        HttpStatus.TOO_MANY_REQUESTS, // 429
      );
    }

    next();
  }
}
