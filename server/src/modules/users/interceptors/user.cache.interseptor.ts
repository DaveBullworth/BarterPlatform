import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  PreconditionFailedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { RedisService } from '@/common/services/redis/redis.service';
import type { AuthenticatedRequest } from '@/common/interfaces/auth-request.interface';

@Injectable()
export class UserUpdatedInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  async intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!req.user) return next.handle();

    const targetUserId = req.params?.id ?? req.user.sub;
    if (!targetUserId) return next.handle();

    const clientUpdatedAt = req.headers['if-user-updated-since'];
    if (!clientUpdatedAt) return next.handle();

    const redisUpdatedAt = await this.redisService
      .getClient()
      .get(`user:updated:${targetUserId}`);

    if (!redisUpdatedAt) {
      throw new PreconditionFailedException({
        code: 'CACHE_MISS',
        message: 'Cache validation failed, retry without If-User-Updated-Since',
      });
    }

    if (new Date(redisUpdatedAt) <= new Date(clientUpdatedAt as string)) {
      throw new HttpException('', HttpStatus.NOT_MODIFIED); // 304
    }

    // cache-miss → НЕ идём в БД
    throw new PreconditionFailedException({
      code: 'CACHE_STALE',
      message: 'Cache is stale, retry without If-User-Updated-Since',
    });
  }
}
