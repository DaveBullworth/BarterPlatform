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

  private readonly LIMIT = 10; // максимум 10 запросов
  private readonly WINDOW = 10; // окно в секундах

  async use(req: AppRequest, res: Response, next: NextFunction) {
    const deviceId = req.cookies.device_id;
    if (!deviceId) return next(); // на всякий случай, хотя device_id всегда есть

    const redis = this.redisService.getClient();
    const key = `rate:dev:${deviceId}`;

    // Инкрементируем счётчик
    const requests = await redis.incr(key);

    if (requests === 1) {
      // Первый запрос, ставим TTL
      await redis.expire(key, this.WINDOW);
    }

    if (requests > this.LIMIT) {
      // Превышен лимит → 429
      throw new HttpException(
        { code: SecurityErrorCode.TOO_MANY_REQUESTS },
        HttpStatus.TOO_MANY_REQUESTS, // 429
      );
    }

    next();
  }
}
