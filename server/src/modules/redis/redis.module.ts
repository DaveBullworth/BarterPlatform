import { Module } from '@nestjs/common';
import { RedisService } from '@/common/services/redis/redis.service';

@Module({
  providers: [RedisService],
  exports: [RedisService], // <-- разрешаем использовать в других модулях
})
export class RedisModule {}
