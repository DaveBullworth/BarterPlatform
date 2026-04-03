import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SetPrimaryLotImageDto {
  @ApiProperty({
    description: 'ID изображения лота, которое нужно назначить главным',
    example: '8fb8f722-44b0-4f7a-beb5-4dcfcbce84d2',
  })
  @IsUUID('4')
  imageId!: string;
}
