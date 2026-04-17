import {
  IsString,
  IsIn,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  IsDateString,
} from 'class-validator';

export class TextFilterDto {
  @IsString()
  @IsIn(['contains', 'equals', 'not_contains', 'not_equals'])
  operator!: 'contains' | 'equals' | 'not_contains' | 'not_equals';

  @IsString()
  value!: string;
}

export class BooleanFilterDto {
  @IsBoolean()
  value!: boolean;
}

export class MultiTextFilterDto {
  @IsIn(['contains', 'equals', 'not_contains', 'not_equals'])
  operator!: 'contains' | 'equals' | 'not_contains' | 'not_equals';

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  values!: string[];
}

export class DateRangeFilterDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsDateString({}, { each: true })
  values!: [string, string]; // [from, to]
}

export class IDFilter {
  @IsString()
  value!: string;
}
