import { Module } from '@nestjs/common';
// Импортируем модуль TypeORM для работы с БД внутри Nest
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailConfirmModule } from '../mail-confirm/mail-confirm.module';
import { RedisModule } from '../redis/redis.module';
import { UsersService } from './users.service';
import { UserEntity } from 'src/database/entities/user.entity';
import { CountryEntity } from 'src/database/entities/country.entity';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, CountryEntity]),
    MailConfirmModule,
    AuthModule,
    RedisModule,
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
