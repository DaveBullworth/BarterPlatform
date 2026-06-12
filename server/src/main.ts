// Импортируем необходимые модули NestJS и утилиты
import { cwd } from 'process';
import { NestFactory } from '@nestjs/core'; // фабрика для запуска приложения Nest
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express'; // расширение Nest для работы с Express
import { join } from 'path'; // стандартный модуль Node.js для работы с путями
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // инструменты для автогенерации Swagger
import { AppModule } from './app.module'; // главный модуль приложения
import { AppDataSource } from './database/data-source';
import { requestLogger } from '@/common/services/logger/request.logger';
import { AllExceptionsFilter } from '@/common/services/logger/exceptions.logger';

// --- Миграции и сидирование для продакшена ---
async function prepareDatabase() {
  if (process.env.NODE_ENV !== 'production') return;

  console.log('📦 Initializing DB for migrations...');
  await AppDataSource.initialize();

  console.log('📦 Running migrations...');
  await AppDataSource.runMigrations();

  if (process.env.SEED === 'true') {
    console.log('🌱 Running seeds automatically in prod...');
    const seedModule = await import('./database/seed.js');
    await seedModule.runSeeds();
  }

  console.log('✅ Database ready');
}

async function bootstrap() {
  // Подготовка базы данных (миграции + сиды) до старта приложения
  await prepareDatabase();

  // Создаём экземпляр приложения NestJS, используя Express
  // Тип <NestExpressApplication> нужен, чтобы использовать методы Express, например useStaticAssets
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Для получения реального ip из запросов
  app.set('trust proxy', true);

  // Поддержка CORS для потока запросов между разными доменами
  // app.enableCors({
  //   origin: [
  //     'http://localhost:5173',
  //     'http://192.168.1.2:5173',
  //     'http://10.10.243.97:5173',
  //   ],
  //   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  //   allowedHeaders: [
  //     'Content-Type',
  //     'Authorization',
  //     'If-None-Match',
  //     'X-Request-Id',
  //   ],
  //   exposedHeaders: ['ETag', 'Retry-After', 'X-Request-Id'],
  //   credentials: true,
  // });

  // HTTP request logging
  app.use(requestLogger);

  // Логирование неотлавливаемых ошибок
  app.useGlobalFilters(new AllExceptionsFilter());

  // ГЛОБАЛЬНАЯ ВАЛИДАЦИЯ DTO (ОБЯЗАТЕЛЬНО)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // удаляет лишние поля из body
      forbidNonWhitelisted: true, // кидает 400, если пришли лишние поля
      transform: true, // приводит типы (string → number и т.д.)
      stopAtFirstError: false, //
      // кастомная фабрика оишбок валидации
      exceptionFactory: (errors) => {
        console.error('VALIDATION ERRORS:', errors);
        // расплющивает все ошибки по всем полям в один массив строк
        const messages = errors.flatMap((err) =>
          err.constraints ? Object.values(err.constraints) : [],
        );
        return new BadRequestException({
          statusCode: 400,
          message: messages,
          error: 'Bad Request',
        });
      },
    }),
  );

  // Подключаем папку с публичными статическими файлами
  // Все файлы в 'public' будут доступны напрямую по URL, например: http://localhost:3000/logo.svg
  app.useStaticAssets(join(cwd(), 'public'));

  // Настраиваем Swagger (OpenAPI) для автогенерации документации
  const config = new DocumentBuilder()
    .setTitle('Barter Platform API') // Название API
    .setDescription('API для управления пользователями, лотами и обменами') // Описание
    .setVersion('0.1') // Версия API
    .addBearerAuth() // Добавляем возможность авторизации через Bearer Token
    .build();

  // Создаём документ Swagger на основе конфигурации и всех декораторов в коде
  const document = SwaggerModule.createDocument(app, config);

  // Настраиваем маршрут, где будет доступна UI документация Swagger
  // Здесь это /api, т.е. Swagger откроется по ссылке: http://localhost:3000/api
  SwaggerModule.setup('api', app, document);

  // Запускаем приложение на порту из переменной окружения PORT или 3000 по умолчанию
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

// Обёртываем bootstrap в try/catch с .catch, чтобы корректно ловить ошибки старта
bootstrap().catch((err) => {
  console.error('Failed to start NestJS app', err);
  process.exit(1); // Выходим с кодом ошибки, если не удалось поднять сервер
});
