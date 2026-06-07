import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { OfferStatus } from '@/database/entities/offer.entity';

export type OfferRole = 'incoming' | 'outgoing';

export class GetOffersQueryDto {
  @ApiPropertyOptional({
    enum: ['incoming', 'outgoing'],
    description:
      'incoming — где я получатель, outgoing — где я предлагающий. По умолчанию — оба.',
  })
  @IsOptional()
  @IsIn(['incoming', 'outgoing'])
  role?: OfferRole;

  @ApiPropertyOptional({ enum: OfferStatus })
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;
}
