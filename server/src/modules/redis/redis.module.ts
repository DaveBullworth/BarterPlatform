import { Module } from '@nestjs/common';
import { RedisService } from '@/common/services/redis/redis.service';
import { RedisLotArchiveService } from '@/common/services/redis/redis.archive';
import { RedisVersionService } from '@/common/services/redis/redis.version';
import { RedisSessionService } from '@/common/services/redis/redis.session';

@Module({
  providers: [
    RedisService,
    RedisSessionService,
    RedisVersionService,
    RedisLotArchiveService,
  ],
  exports: [
    RedisService,
    RedisSessionService,
    RedisVersionService,
    RedisLotArchiveService,
  ], // <-- разрешаем использовать в других модулях
})
export class RedisModule {}
