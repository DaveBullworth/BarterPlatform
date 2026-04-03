import { ApiProperty } from '@nestjs/swagger';

class LotImageResponse {
  @ApiProperty({
    description: 'ID изображения лота',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  imageId!: string;

  @ApiProperty({
    description: 'Флаг основного изображения',
    example: true,
  })
  isPrimary!: boolean;

  @ApiProperty({
    description: 'MIME тип изображения',
    example: 'image/png',
  })
  mimeType!: string;

  @ApiProperty({
    description: 'Изображение в сжатом виде (base64)',
    example: 'iVBORw0KGgoAAAANSUhEUgAAAAUA...',
  })
  data!: string;
}

export class GetLotImagesResponse {
  @ApiProperty({
    description: 'ID лота',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  lotId!: string;

  @ApiProperty({
    description: 'Массив изображений лота (сжатые, base64)',
    type: [LotImageResponse],
  })
  images!: LotImageResponse[];
}
