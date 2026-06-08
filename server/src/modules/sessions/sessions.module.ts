import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionEntity } from '@/database/entities/session.entity';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  // AuthModule даёт гварды (@Authenticated) и SessionPolicyService (revoke /
  // cleanupExpired). Зависимость односторонняя: sessions → auth.
  imports: [TypeOrmModule.forFeature([SessionEntity]), AuthModule, RedisModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
