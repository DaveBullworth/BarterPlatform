import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserTaxonomyPreferenceEntity } from '@/database/entities/user-taxonomy-preference.entity';
import { AuthModule } from '../auth/auth.module';
import { TaxonomyModule } from '../taxonomy/taxonomy.module';
import { RedisModule } from '../redis/redis.module';
import { UserPreferencesController } from './user-preferences.controller';
import { UserPreferencesService } from './user-preferences.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTaxonomyPreferenceEntity]),
    AuthModule,
    TaxonomyModule,
    RedisModule,
  ],
  controllers: [UserPreferencesController],
  providers: [UserPreferencesService],
  exports: [UserPreferencesService],
})
export class UserPreferencesModule {}
