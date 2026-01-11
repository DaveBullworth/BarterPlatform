// Импортируем необходимые модули NestJS и утилиты
import { NestFactory } from '@nestjs/core'; // фабрика для запуска приложения Nest
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express'; // расширение Nest для работы с Express
import { join } from 'path'; // стандартный модуль Node.js для работы с путями
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // инструменты для автогенерации Swagger
import { AppModule } from './app.module'; // главный модуль приложения
import { requestLogger } from '@/common/services/logger/request.logger';
import { AllExceptionsFilter } from '@/common/services/logger/exceptions.logger';

async function bootstrap() {
  // Создаём экземпляр приложения NestJS, используя Express
  // Тип <NestExpressApplication> нужен, чтобы использовать методы Express, например useStaticAssets
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
  app.useStaticAssets(join(__dirname, '..', 'public'));

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
