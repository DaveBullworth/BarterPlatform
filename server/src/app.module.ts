import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from './database/entities/user.entity';

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

    TypeOrmModule.forFeature([UserEntity]),
  ],
})
export class AppModule {}
