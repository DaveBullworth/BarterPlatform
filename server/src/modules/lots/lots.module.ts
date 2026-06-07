import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotEntity } from '@/database/entities/lot.entity';
import { LotsController } from './lots.controller';
import { LotsService } from './lots.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '../users/users.module';
import { TaxonomyModule } from '../taxonomy/taxonomy.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LotUpdatedInterceptor } from './interceptors/lot.cache.interceptor';
import { LotArchiveService } from './lot-archive.service';
import { LotArchiveCleanupService } from './lot-archive-cleanup.service';
import { LotRelevanceService } from './lot-relevance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LotEntity]),
    AuthModule,
    RedisModule,
    UsersModule,
    TaxonomyModule,
    NotificationsModule,
  ],
  controllers: [LotsController],
  providers: [
    LotsService,
    LotRelevanceService,
    LotArchiveService,
    LotArchiveCleanupService,
    LotUpdatedInterceptor,
  ],
  exports: [LotsService],
})
export class LotsModule {}
