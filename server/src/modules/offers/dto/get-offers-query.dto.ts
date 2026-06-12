import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

import { OfferStatus } from '@/database/entities/offer.entity';

export type OfferRole = 'incoming' | 'outgoing';

export class GetOffersQueryDto {
  @ApiPropertyOptional({
    enum: ['incoming', 'outgoing'],
    description:
      'incoming — где пользователь получатель, outgoing — где предлагающий. По умолчанию — оба.',
  })
  @IsOptional()
  @IsIn(['incoming', 'outgoing'])
  role?: OfferRole;

  @ApiPropertyOptional({
    enum: OfferStatus,
    isArray: true,
    description:
      'Фильтр по статусам. Принимает повтор параметра или CSV-строку. По умолчанию — все статусы.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @IsEnum(OfferStatus, { each: true })
  statuses?: OfferStatus[];

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description:
      'Только для ADMIN: просмотр предложений от лица указанного пользователя.',
  })
  @IsOptional()
  @IsUUID()
  asUserId?: string;
}
