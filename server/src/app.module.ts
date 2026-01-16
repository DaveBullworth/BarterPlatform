import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareModule } from './common/middlewares/middleware.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CountriesModule } from './modules/countries/countries.module';
import { TypeOrmLogger } from './common/services/logger/typeorm.logger';
import { MailModule } from './modules/mail/mail.module';
import { MailConfirmModule } from './modules/mail-confirm/mail-confirm.module';
import { RedisModule } from './modules/redis/redis.module';
import { MediaModule } from './modules/media/media.module';
import { PasswordResetModule } from './modules/password-reset/password-reset.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('POSTGRES_HOST'),
        port: Number(config.get('POSTGRES_PORT')),
        username: config.get('POSTGRES_USER'),
        password: config.get('POSTGRES_PASSWORD'),
        database: config.get('POSTGRES_DB'),

        // Cущности
        autoLoadEntities: true, // Nest сам найдёт все Entity

        // synchronize: false, // для новых миграций через dev контейнер
        synchronize: config.get('NODE_ENV') === 'development', // dev only
        logging: config.get('NODE_ENV') === 'development', // dev only
        // SQL логирование
        logger: new TypeOrmLogger(),
      }),
    }),

    MiddlewareModule,
    AuthModule,
    UsersModule,
    CountriesModule,
    MailModule,
    MailConfirmModule,
    RedisModule,
    MediaModule,
    PasswordResetModule,
  ],
})
export class AppModule {}
