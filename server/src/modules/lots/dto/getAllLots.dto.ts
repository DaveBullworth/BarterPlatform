import { IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransformJsonObject } from '@/common/decorators/transform-json-object.decorator';
import { LotVisibilityStatus } from '@/database/entities/lot.entity';
import { LotFiltersDto } from './lotFilters.dto';
import { GeographyNodeDto } from '@/common/dtos/geo-node.dto';

export class GetLotsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @TransformJsonObject<LotFiltersDto>()
  filters?: LotFiltersDto;
}

export class LotResponseDto {
  @ApiProperty({ example: '6a8c5b1e-3e42-4e6f-bd22-8b7c2b5c91aa' })
  id!: string;

  @ApiProperty({
    example: 1,
    description: 'ID раздела (chapter)',
  })
  chapterId!: number;

  @ApiProperty({
    example: 10,
    description: 'ID категории',
  })
  categoryId!: number;

  @ApiPropertyOptional({
    example: 101,
    description: 'ID подкатегории (если есть)',
    nullable: true,
  })
  subcategoryId?: number;

  @ApiProperty({
    example: 'Продам MacBook Pro 14"',
    description: 'Краткое описание лота',
  })
  generalDescription!: string;

  @ApiProperty({
    example: 'M1 Pro, 16GB RAM, 512GB SSD, отличное состояние',
    description: 'Подробное описание характеристик товара',
  })
  characteristicsDescription!: string;

  @ApiProperty({
    example: 1,
    description: 'Количество товара (по умолчанию 1)',
    minimum: 1,
  })
  quantity!: number;

  @ApiProperty({
    enum: [LotVisibilityStatus.HIDDEN, LotVisibilityStatus.ACTIVE],
    example: LotVisibilityStatus.HIDDEN,
    description: 'Статус видимости лота',
  })
  visibilityStatus!: LotVisibilityStatus;

  @ApiProperty({ type: () => GeographyNodeDto, nullable: true })
  region!: GeographyNodeDto | null;

  @ApiProperty({ type: () => GeographyNodeDto, nullable: true })
  city!: GeographyNodeDto | null;

  @ApiProperty({ type: () => GeographyNodeDto, nullable: true })
  district!: GeographyNodeDto | null;

  @ApiPropertyOptional({
    example: '2024-02-01T12:00:00.000Z',
    nullable: true,
  })
  archivationDate?: string | null;

  @ApiProperty({
    type: [String],
    example: ['https://cdn.site.com/image1.jpg'],
    description: 'Массив ссылок на изображения лота',
  })
  imageLinks!: string[];

  @ApiProperty({
    example: '2024-01-01T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2024-01-01T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt!: Date;
}
