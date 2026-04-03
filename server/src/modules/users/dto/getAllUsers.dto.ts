import { IsOptional, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransformJsonArray } from '@/common/decorators/transform-json-array.decorator';
import { TransformJsonObject } from '@/common/decorators/transform-json-object.decorator';
import { UserRole } from '@/database/entities/user.entity';
import { SortItemDto } from '@/common/dtos/sort-item.dto';
import { UserFiltersDto } from './userFilters.dto';

export class GetUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'JSON string of sorting rules',
    example: '[{"id":"login","desc":false}]',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @TransformJsonArray(SortItemDto)
  sorting?: SortItemDto[];

  @IsOptional()
  @TransformJsonObject<UserFiltersDto>()
  filters?: UserFiltersDto;
}

export class GeographyNodeDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'Минская область' })
  name!: string;
}

export class UserResponseDto {
  @ApiProperty({ example: '6a8c5b1e-3e42-4e6f-bd22-8b7c2b5c91aa' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'john_doe' })
  login!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role!: UserRole;

  @ApiProperty({ example: true })
  status!: boolean;

  @ApiPropertyOptional({ example: '+375291234567', nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ type: () => GeographyNodeDto, nullable: true })
  region!: GeographyNodeDto | null;

  @ApiPropertyOptional({ type: () => GeographyNodeDto, nullable: true })
  city!: GeographyNodeDto | null;

  @ApiPropertyOptional({ type: () => GeographyNodeDto, nullable: true })
  district!: GeographyNodeDto | null;

  @ApiProperty({
    example: '2024-01-01T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;
}
