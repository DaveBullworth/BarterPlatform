import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { TextFilterDto } from '../dtos/filter-item.dto';

export function applyTextFilter<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  field: string,
  filter: TextFilterDto,
  paramKey: string,
) {
  const value = filter.value;

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
