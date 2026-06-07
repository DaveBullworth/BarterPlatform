import { ApiProperty } from '@nestjs/swagger';

/**
 * Маскированные предпочтения пользователя: только факт интереса (true), без
 * весов. Узел считается «интересным», если у пользователя есть запись с любым
 * весом (1..3). Используется при выборе лотов для предложения обмена.
 */
export class PreferenceAvailabilityDto {
  @ApiProperty({ type: [Number], example: [1, 4] })
  chapterIds!: number[];

  @ApiProperty({ type: [Number], example: [10, 25] })
  categoryIds!: number[];

  @ApiProperty({ type: [Number], example: [101, 254] })
  subcategoryIds!: number[];
}
