// Controller — объявляет HTTP-контроллер
// Get — обработка GET-запросов
// Query — доступ к query-параметрам (?search=...)
import { Controller, Get } from '@nestjs/common';

// Импортируем сервис, который содержит логику
import { CountriesService } from './countries.service';

// Импортируем сущность для типизации ответа
import { CountryEntity } from '../../database/entities/country.entity';

// Декоратор Controller
// 'countries' — базовый URL
// Все маршруты будут начинаться с /countries
@Controller('countries')
export class CountriesController {
  // Внедряем сервис через конструктор
  constructor(
    // Nest сам создаст и передаст CountriesService
    private readonly countriesService: CountriesService,
  ) {}

  // Декоратор Get — обрабатывает GET /countries
  @Get()
  // Метод контроллера
  async getAll(): Promise<CountryEntity[]> {
    // Передаём управление сервису
    // Контроллер сам ничего не считает
    return this.countriesService.getAll();
  }
}
