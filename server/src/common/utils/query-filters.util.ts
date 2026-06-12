import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { TextFilterDto } from '../dtos/filter-item.dto';

export function applyTextFilter<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  field: string,
  filter: TextFilterDto,
  paramKey: string,
) {
  // Фильтры приходят JSON-строкой мимо валидации DTO — кап длины здесь,
  // в единственной точке применения, защищает от произвольно длинных паттернов.
  const value = filter.value.slice(0, 255);

  switch (filter.operator) {
    case 'contains':
      qb.andWhere(`${field} ILIKE :${paramKey}`, {
        [paramKey]: `%${value}%`,
      });
      break;

    case 'equals':
      qb.andWhere(`${field} = :${paramKey}`, {
        [paramKey]: value,
      });
      break;

    case 'not_contains':
      qb.andWhere(`${field} NOT ILIKE :${paramKey}`, {
        [paramKey]: `%${value}%`,
      });
      break;

    case 'not_equals':
      qb.andWhere(`${field} != :${paramKey}`, {
        [paramKey]: value,
      });
      break;
  }
}
