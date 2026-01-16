import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { entities } from './entities';
import type { EntitySchema } from 'typeorm';

// Тип для Entity класса
type EntityClass = { new (...args: any[]): any } | EntitySchema<any> | string;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: entities as EntityClass[],
  migrations: ['dist/database/migrations/*.js'], // для получения папки содержащей миграции
  // synchronize: false, // для новых миграций через dev контейнер
  synchronize: process.env.NODE_ENV === 'development',
});
