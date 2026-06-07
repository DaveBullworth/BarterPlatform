import { Module } from '@nestjs/common';
// Импортируем модуль TypeORM для работы с БД внутри Nest
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailConfirmModule } from '../mail-confirm/mail-confirm.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersService } from './users.service';
import { UserEntity } from 'src/database/entities/user.entity';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { UserUpdatedInterceptor } from './interceptors/user.cache.interseptor';
import { GeographyService } from './geography.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    MailConfirmModule,
    AuthModule,
    RedisModule,
    NotificationsModule,
  ],
  providers: [UsersService, GeographyService, UserUpdatedInterceptor],
  exports: [UsersService, GeographyService],
  controllers: [UsersController],
})
export class UsersModule {}
