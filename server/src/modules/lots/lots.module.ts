import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotEntity } from '@/database/entities/lot.entity';
import { LotsController } from './lots.controller';
import { LotsService } from './lots.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '../users/users.module';
import { LotUpdatedInterceptor } from './interceptors/lot.cache.interceptor';
import { TaxonomyService } from './taxonomy.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LotEntity]),
    AuthModule,
    RedisModule,
    UsersModule,
  ],
  controllers: [LotsController],
  providers: [LotsService, TaxonomyService, LotUpdatedInterceptor],
  exports: [LotsService],
})
export class LotsModule {}
