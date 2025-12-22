// Injectable делает класс доступным для Dependency Injection (DI)
import { Injectable } from '@nestjs/common';

// InjectRepository позволяет внедрять репозиторий TypeORM
import { InjectRepository } from '@nestjs/typeorm';

// Repository — основной API TypeORM для работы с таблицами
import { Repository } from 'typeorm';

// Импортируем сущность страны (таблицу countries)
import { CountryEntity } from '../../database/entities/country.entity';

// Декоратор Injectable — говорит Nest, что этот класс можно внедрять
@Injectable()
export class CountriesService {
  // Конструктор сервиса
  constructor(
    // Внедряем репозиторий для CountryEntity
    // Nest сам создаст Repository<CountryEntity> и передаст сюда
    @InjectRepository(CountryEntity)
    private readonly countryRepo: Repository<CountryEntity>,
  ) {}

  // Метод получения всех стран
  async getAll(): Promise<CountryEntity[]> {
    // Отдаем все страны, сортируем по имени
    return this.countryRepo.find({
      order: { name: 'ASC' },
    });
  }
}
