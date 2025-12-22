import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CountriesModule } from './modules/countries/countries.module';
import { UsersModule } from './modules/users/users.module';
import { AuthController } from './modules/auth/auth.controller';
import { AuthModule } from './modules/auth/auth.module';

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

        synchronize: config.get('NODE_ENV') === 'development', // 🔹 dev only
        logging: config.get('NODE_ENV') === 'development', // 🔹 dev only
      }),
    }),

    UsersModule,
    CountriesModule,
    AuthModule,
  ],
  controllers: [AuthController],
})
export class AppModule {}
