import { ApiProperty } from '@nestjs/swagger';

/** Минимальная карточка пользователя для админского поиска (селект «от лица»). */
export class UserSearchItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'ivan_petrov' })
  login!: string;

  @ApiProperty({ example: 'Иван Петров' })
  name!: string;

  @ApiProperty({ example: 'ivan@example.com' })
  email!: string;
}
