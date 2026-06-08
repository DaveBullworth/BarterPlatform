import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Идентификатор сессии',
  })
  id!: string;

  @ApiProperty({
    example: '192.168.1.1',
    nullable: true,
    description: 'IP, с которого создана сессия',
  })
  ip!: string | null;

  @ApiProperty({
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
    nullable: true,
    description: 'User-Agent устройства (парсится на клиенте)',
  })
  userAgent!: string | null;

  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    nullable: true,
    description: 'Идентификатор устройства',
  })
  deviceId!: string | null;

  @ApiProperty({
    example: '2026-01-11T10:30:00.000Z',
    description: 'Когда сессия была создана',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-01-15T08:12:00.000Z',
    nullable: true,
    description: 'Последняя активность сессии',
  })
  lastSeenAt!: Date | null;

  @ApiProperty({
    example: '2026-02-10T10:30:00.000Z',
    description: 'Когда сессия истекает',
  })
  expiresAt!: Date;

  @ApiProperty({
    example: true,
    description: 'Это текущая сессия запрашивающего пользователя',
  })
  current!: boolean;
}
