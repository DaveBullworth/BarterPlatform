import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import {
  TextFilterDto,
  BooleanFilterDto,
  MultiTextFilterDto,
  DateRangeFilterDto,
} from '@/common/dtos/filter-item.dto';

export class UserFiltersDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TextFilterDto)
  login?: TextFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TextFilterDto)
  name?: TextFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TextFilterDto)
  email?: TextFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TextFilterDto)
  phone?: TextFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BooleanFilterDto)
  role?: BooleanFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BooleanFilterDto)
  status?: BooleanFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultiTextFilterDto)
  country?: MultiTextFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeFilterDto)
  createdAt?: DateRangeFilterDto;
}
