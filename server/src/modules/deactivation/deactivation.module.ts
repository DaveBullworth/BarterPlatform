import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { DeactivationController } from './deactivation.controller';
import { DeactivationService } from './deactivation.service';
import { DeactivationPolicy } from './policies/deactivation.policy';
import { AccountDeactivationCodeEntity } from '@/database/entities/account_deactivation_code.entity';
import { UserEntity } from '@/database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountDeactivationCodeEntity, UserEntity]),
    MailModule,
    RedisModule,
    AuthModule,
  ],
  controllers: [DeactivationController],
  providers: [DeactivationService, DeactivationPolicy],
})
export class DeactivationModule {}
