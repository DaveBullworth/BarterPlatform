import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OfferEntity } from '@/database/entities/offer.entity';
import { LotEntity } from '@/database/entities/lot.entity';
import { AuthModule } from '../auth/auth.module';
import { UserPreferencesModule } from '../user-preferences/user-preferences.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RedisModule } from '../redis/redis.module';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OfferEntity, LotEntity]),
    AuthModule,
    RedisModule,
    UserPreferencesModule,
    NotificationsModule,
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
