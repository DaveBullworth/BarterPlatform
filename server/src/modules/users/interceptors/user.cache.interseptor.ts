import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';
import type { Response } from 'express';

import { redisLogger } from '@/common/services/logger/logger.scopes';
import { RedisVersionService } from '@/common/services/redis/redis.version';
import type { AuthenticatedRequest } from '@/common/interfaces/auth-request.interface';

@Injectable()
export class UserUpdatedInterceptor implements NestInterceptor {
  constructor(private readonly redisVersionService: RedisVersionService) {}

  async intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const res = ctx.switchToHttp().getResponse<Response>();

    if (!req.user) return next.handle();

    const targetUserId = req.params?.id ?? req.user.sub;
    if (!targetUserId) return next.handle();

    const startedAt = Date.now();
    const currentEtag =
      await this.redisVersionService.getUserEtag(targetUserId);
    if (!currentEtag) return next.handle();

    const ifNoneMatch = req.headers['if-none-match'];
    const matched = this.matchesIfNoneMatch(ifNoneMatch, currentEtag);

    if (matched) {
      res.setHeader('ETag', currentEtag);
      redisLogger.info('user_cache_not_modified', {
        userId: targetUserId,
        metric: 'cache_hit',
        redisLookupMs: Date.now() - startedAt,
        requestId: req.requestId,
      });
      throw new HttpException('', HttpStatus.NOT_MODIFIED); // 304
    }

    redisLogger.info('user_cache_stale', {
      userId: targetUserId,
      metric: 'cache_stale',
      redisLookupMs: Date.now() - startedAt,
      requestId: req.requestId,
    });

    return next.handle().pipe(
      tap(() => {
        res.setHeader('ETag', currentEtag);
      }),
    );
  }

  private matchesIfNoneMatch(
    ifNoneMatch: unknown,
    currentEtag: string,
  ): boolean {
    if (!ifNoneMatch || typeof ifNoneMatch !== 'string') return false;
    const tags = ifNoneMatch.split(',').map((tag) => tag.trim());

    return tags.some(
      (tag) => this.normalizeEtag(tag) === this.normalizeEtag(currentEtag),
    );
  }

  private normalizeEtag(etag: string): string {
    return etag.replace(/^W\//, '');
  }
}
