import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { RedisModule } from '@/modules/redis/redis.module';
import { RedisService } from '@/common/services/redis/redis.service';
import { RedisThrottlerStorage } from './redis-throttler.storage';
import { AppThrottlerGuard } from './app-throttler.guard';

@Module({
  imports: [
    RedisModule,
    ThrottlerModule.forRootAsync({
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        storage: new RedisThrottlerStorage(redisService),
        setHeaders: true,
        throttlers: [
          {
            name: 'cheap',
            ttl: 5_000,
            limit: 100,
            skipIf: (context) => {
              const request = context.switchToHttp().getRequest<{
                headers?: Record<string, string | string[] | undefined>;
              }>();
              return !request.headers?.['if-none-match'];
            },
          },
          {
            name: 'heavy',
            ttl: 5_000,
            limit: 20,
            skipIf: (context) => {
              const request = context.switchToHttp().getRequest<{
                headers?: Record<string, string | string[] | undefined>;
              }>();
              return Boolean(request.headers?.['if-none-match']);
            },
          },
        ],
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class ThrottlingModule {}
