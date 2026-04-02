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

export class CreateLotDto {
  @ApiProperty({
    example: 1,
    description: 'ID раздела (chapter)',
  })
  @IsInt()
  chapterId: number;

  @ApiProperty({
    example: 10,
    description: 'ID категории',
  })
  @IsInt()
  categoryId: number;

  @ApiProperty({
    example: 101,
    description: 'ID подкатегории (если есть)',
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
  })
  @IsString()
  @MaxLength(255)
  generalDescription: string;

  @ApiProperty({
    example: 'M1 Pro, 16GB RAM, 512GB SSD, отличное состояние',
    description: 'Подробное описание характеристик товара',
  })
  @IsString()
  characteristicsDescription: string;

  @ApiProperty({
    example: 1,
    description: 'Количество товара (по умолчанию 1)',
    required: false,
    minimum: 1,
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
