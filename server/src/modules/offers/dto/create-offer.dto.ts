import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateOfferDto {
  @ApiProperty({
    example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c99',
    description: 'ID лота получателя, на который делается предложение',
  })
  @IsUUID('all')
  lotId!: string;

  @ApiProperty({
    type: [String],
    description:
      'ID своих лотов, предлагаемых в обмен (от 1 до 5, без повторов)',
    example: ['c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  offeredLotIds!: string[];
}
