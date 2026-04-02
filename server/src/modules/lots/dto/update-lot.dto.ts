import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { LotVisibilityStatus } from '@/database/entities/lot.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLotDto {
  @ApiProperty({
    example: 1,
    description: 'ID раздела (chapter)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  chapterId?: number;

  @ApiProperty({
    example: 10,
    description: 'ID категории',
    required: false,
  })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiProperty({
    example: 101,
    description: 'ID подкатегории (может быть null)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  subcategoryId?: number;

  @ApiProperty({
    example: 'Продам MacBook Pro 14"',
    description: 'Краткое описание лота',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  generalDescription?: string;

  @ApiProperty({
    example: 'M1 Pro, 16GB RAM, 512GB SSD, отличное состояние',
    description: 'Подробное описание характеристик товара',
    required: false,
  })
  @IsOptional()
  @IsString()
  characteristicsDescription?: string;

  @ApiProperty({
    example: 2,
    description: 'Количество товара',
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({
    enum: LotVisibilityStatus,
    example: LotVisibilityStatus.HIDDEN,
    description: 'Статус видимости лота',
    required: false,
  })
  @IsOptional()
  @IsEnum(LotVisibilityStatus)
  visibilityStatus?: LotVisibilityStatus;
}
