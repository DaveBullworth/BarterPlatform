import { ApiProperty } from '@nestjs/swagger';

import { OfferStatus } from '@/database/entities/offer.entity';
import { LotResponseDto } from '../../lots/dto/getAllLots.dto';
import type { OfferRole } from './get-offers-query.dto';

export class OfferCounterpartDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id!: string;

  @ApiProperty({ example: 'Иван Петров' })
  name!: string;
}

/** Доступные просматривающему действия над предложением. */
export class OfferActionsDto {
  @ApiProperty({ description: 'Можно принять (получатель, PENDING)' })
  canAccept!: boolean;

  @ApiProperty({ description: 'Можно отклонить/отменить (PENDING|ACCEPTED)' })
  canReject!: boolean;

  @ApiProperty({
    description: 'Можно подтвердить обмен (ACCEPTED, ещё не подтверждал)',
  })
  canConfirm!: boolean;
}

export class OfferDetailDto {
  @ApiProperty({ example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01' })
  id!: string;

  @ApiProperty({ enum: OfferStatus })
  status!: OfferStatus;

  @ApiProperty({
    enum: ['incoming', 'outgoing'],
    description: 'Роль просматривающего относительно предложения.',
  })
  role!: OfferRole;

  @ApiProperty({ type: OfferCounterpartDto })
  counterpart!: OfferCounterpartDto;

  @ApiProperty({
    type: LotResponseDto,
    nullable: true,
    description: 'Лот, на который сделано предложение.',
  })
  targetLot!: LotResponseDto | null;

  @ApiProperty({
    type: [LotResponseDto],
    description: 'Лоты, предложенные в обмен.',
  })
  offeredLots!: LotResponseDto[];

  @ApiProperty()
  proposerCompletionConfirmed!: boolean;

  @ApiProperty()
  recipientCompletionConfirmed!: boolean;

  @ApiProperty({
    description: 'Подтвердил ли факт обмена сам просматривающий.',
  })
  viewerConfirmed!: boolean;

  @ApiProperty({ type: OfferActionsDto })
  actions!: OfferActionsDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ nullable: true })
  acceptedAt!: Date | null;

  @ApiProperty({ nullable: true })
  completedAt!: Date | null;

  @ApiProperty({ nullable: true })
  rejectedAt!: Date | null;

  @ApiProperty()
  updatedAt!: Date;
}
