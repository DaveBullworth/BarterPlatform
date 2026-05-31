import { ApiProperty } from '@nestjs/swagger';
import { TaxonomyTargetType } from '@/database/entities/user-taxonomy-preference.entity';

export class UserPreferenceResponseDto {
  @ApiProperty({ enum: TaxonomyTargetType })
  targetType!: TaxonomyTargetType;

  @ApiProperty({ example: 101 })
  targetId!: number;

  @ApiProperty({ example: 3 })
  weight!: 1 | 2 | 3;
}

export class UserPreferencesListResponseDto {
  @ApiProperty({ type: [UserPreferenceResponseDto] })
  items!: UserPreferenceResponseDto[];
}
