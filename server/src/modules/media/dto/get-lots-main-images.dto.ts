import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class GetLotsMainImagesDto {
  @ApiProperty({
    description: 'Массив ID лотов для получения главных изображений',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01',
    ],
    maxItems: 100,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  lotIds!: string[];
}

class LotMainImageResponse {
  @ApiProperty({
    description: 'ID лота',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  lotId!: string;

  @ApiProperty({
    description: 'ID изображения (null, если изображения нет)',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    nullable: true,
  })
  imageId!: string | null;

  @ApiProperty({
    description: 'MIME тип изображения',
    example: 'image/png',
    nullable: true,
  })
  mimeType!: string | null;

  @ApiProperty({
    description: 'Главное изображение в сильно сжатом виде (base64)',
    example: 'iVBORw0KGgoAAAANSUhEUgAAAAUA...',
    nullable: true,
  })
  data!: string | null;
}

export class GetLotsMainImagesResponse {
  @ApiProperty({
    description: 'Массив главных изображений для запрошенных лотов',
    type: [LotMainImageResponse],
  })
  items!: LotMainImageResponse[];
}
