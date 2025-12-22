// Импортируем декоратор Module — он нужен, чтобы объявить Nest-модуль
import { Module } from '@nestjs/common';

// Импортируем модуль TypeORM для работы с БД внутри Nest
import { TypeOrmModule } from '@nestjs/typeorm';

// Импортируем сущность Country — это таблица countries в БД
import { CountryEntity } from '../../database/entities/country.entity';

// Импортируем сервис, где будет бизнес-логика
import { CountriesService } from './countries.service';

// Импортируем контроллер, который будет принимать HTTP-запросы
import { CountriesController } from './countries.controller';

// Декоратор Module — описывает, из чего состоит данный модуль
@Module({
  // imports — какие другие модули/зависимости нужны этому модулю
  imports: [
    // Регистрируем CountryEntity в TypeORM
    // Это позволяет использовать Repository<CountryEntity> внутри этого модуля
    TypeOrmModule.forFeature([CountryEntity]),
  ],

  // controllers — какие контроллеры относятся к этому модулю
  controllers: [
    // Контроллер, который обрабатывает /countries запросы
    CountriesController,
  ],

  // providers — сервисы (провайдеры), доступные внутри модуля
  providers: [
    // Сервис со всей логикой работы со странами
    CountriesService,
  ],

  // exports — что мы разрешаем использовать другим модулям
  exports: [
    // Экспортируем сервис, чтобы другие модули могли его внедрять
    CountriesService,
  ],
})
// Класс модуля — пустой, нужен только как контейнер для метаданных
export class CountriesModule {}
