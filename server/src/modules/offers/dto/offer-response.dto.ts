import { ApiProperty } from '@nestjs/swagger';

import { OfferStatus } from '@/database/entities/offer.entity';

export class OfferResponseDto {
  @ApiProperty({ example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  proposerId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  recipientId!: string;

  @ApiProperty({ example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c99' })
  lotId!: string;

  @ApiProperty({ type: [String] })
  offeredLotIds!: string[];

  @ApiProperty({ enum: OfferStatus })
  status!: OfferStatus;

  @ApiProperty({ example: false })
  proposerCompletionConfirmed!: boolean;

  @ApiProperty({ example: false })
  recipientCompletionConfirmed!: boolean;

  @ApiProperty({ example: '2026-06-06T10:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-06T12:00:00.000Z' })
  updatedAt!: Date;
}
