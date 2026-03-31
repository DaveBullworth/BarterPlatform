import { ApiProperty } from '@nestjs/swagger';

export class GeoItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Минская область' })
  name: string;
}

export class DistrictDto extends GeoItemDto {
  @ApiProperty({ example: 123 })
  cityId: number;
}
