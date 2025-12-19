import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      autoLoadEntities: true, // Nest сам найдёт все Entity
      synchronize: true, // ⚠️ таблицы создаются автоматически (ТОЛЬКО ДЛЯ DEV)
    }),
    UsersModule,
  ],
})
export class AppModule {}
