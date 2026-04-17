import { IntersectionType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { LotResponseDto } from './getAllLots.dto';

class LotWithUserId {
  @ApiProperty({ example: 'user-uuid' })
  userId!: string;
}

export class LotOneResponseDto extends IntersectionType(
  LotResponseDto,
  LotWithUserId,
) {}
