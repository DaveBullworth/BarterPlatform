import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class SortItemDto {
  @ApiPropertyOptional({ example: 'email' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ example: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  desc: boolean;
}
