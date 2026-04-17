import { ApiProperty } from '@nestjs/swagger';

export class GeographyNodeDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'Минская область' })
  name!: string;
}
