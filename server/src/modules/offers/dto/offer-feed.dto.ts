import { ApiProperty } from '@nestjs/swagger';

import { OfferStatus } from '@/database/entities/offer.entity';
import type { OfferRole } from './get-offers-query.dto';

/** Краткая сводка лота для строки предложения в ленте. */
export class OfferLotSummaryDto {
  @ApiProperty({ example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c99' })
  id!: string;

  @ApiProperty({ example: 'iPhone 13, 128 ГБ' })
  generalDescription!: string;

  @ApiProperty({ example: 5, description: 'Раздел (для иконки на клиенте)' })
  chapterId!: number;
}

export class OfferFeedItemDto {
  @ApiProperty({ example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01' })
  id!: string;

  @ApiProperty({ enum: OfferStatus })
  status!: OfferStatus;

  @ApiProperty({
    enum: ['incoming', 'outgoing'],
    description: 'Роль просматривающего относительно этого предложения.',
  })
  role!: OfferRole;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Другой участник предложения (для аватара).',
  })
  counterpartId!: string;

  @ApiProperty({
    type: OfferLotSummaryDto,
    nullable: true,
    description: 'Целевой лот (может отсутствовать, если удалён).',
  })
  targetLot!: OfferLotSummaryDto | null;

  @ApiProperty({ type: [OfferLotSummaryDto] })
  offeredLots!: OfferLotSummaryDto[];

  @ApiProperty({ example: '2026-06-06T10:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-06T12:00:00.000Z' })
  updatedAt!: Date;
}

export class OffersFeedResponseDto {
  @ApiProperty({ type: [OfferFeedItemDto] })
  data!: OfferFeedItemDto[];

  @ApiProperty({ example: 42 })
  total!: number;
}
