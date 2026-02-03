import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean } from 'class-validator';

export class SortItemDto {
  @ApiPropertyOptional({ example: 'email' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  desc: boolean;
}
