import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { TextFilterDto, IDFilter } from '@/common/dtos/filter-item.dto';

export class LotFiltersDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => IDFilter)
  chapterId?: IDFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => IDFilter)
  categoryId?: IDFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => IDFilter)
  subcategoryId?: IDFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => IDFilter)
  regionId?: IDFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => IDFilter)
  cityId?: IDFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => IDFilter)
  districtId?: IDFilter;

  @IsOptional()
  @ValidateNested()
  @Type(() => TextFilterDto)
  query?: TextFilterDto;

  @IsOptional()
  selfOnly?: boolean;

  /** Константный фильтр для модалки обмена: исключить деактивированные (архивные) лоты. */
  @IsOptional()
  excludeArchived?: boolean;
}
