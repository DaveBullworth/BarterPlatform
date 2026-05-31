import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsPositive,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { TaxonomyTargetType } from '@/database/entities/user-taxonomy-preference.entity';

export class UpsertPreferenceItemDto {
  @ApiProperty({ enum: TaxonomyTargetType, example: TaxonomyTargetType.SUBCATEGORY })
  @IsEnum(TaxonomyTargetType)
  targetType!: TaxonomyTargetType;

  @ApiProperty({ example: 101 })
  @IsInt()
  @IsPositive()
  targetId!: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 3 })
  @IsInt()
  @Min(1)
  @Max(3)
  weight!: 1 | 2 | 3;
}

export class UpsertUserPreferencesDto {
  @ApiProperty({ type: [UpsertPreferenceItemDto] })
  @IsArray()
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => UpsertPreferenceItemDto)
  items!: UpsertPreferenceItemDto[];
}
