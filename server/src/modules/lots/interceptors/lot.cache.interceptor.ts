import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { tap } from 'rxjs/operators';

import { RedisVersionService } from '@/common/services/redis/redis.version';
import type { AppRequest } from '@/common/interfaces/app-request.interface';

@Injectable()
export class LotUpdatedInterceptor implements NestInterceptor {
  constructor(private readonly redisVersionService: RedisVersionService) {}

  async intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest<AppRequest>();
    const res = ctx.switchToHttp().getResponse<Response>();

    const lotId = req.params?.id;
    if (!lotId) return next.handle();

    const currentEtag = await this.redisVersionService.getLotEtag(lotId);
    if (!currentEtag) return next.handle();

    const ifNoneMatch = req.headers['if-none-match'];
    const matched = this.matchesIfNoneMatch(ifNoneMatch, currentEtag);

    if (matched) {
      res.setHeader('ETag', currentEtag);
      throw new HttpException('', HttpStatus.NOT_MODIFIED);
    }

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

    return ifNoneMatch
      .split(',')
      .map((tag) => tag.trim().replace(/^W\//, ''))
      .includes(currentEtag.replace(/^W\//, ''));
  }
}
