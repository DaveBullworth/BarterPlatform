import { IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRole } from '@/database/entities/user.entity';

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
}

export class CountryResponseDto {
  @ApiProperty({
    example: '6a8c5b1e-3e42-4e6f-bd22-8b7c2b5c91aa',
    description: 'Уникальный идентификатор страны',
  })
  id: string;

  @ApiProperty({
    example: 'Germany',
    description: 'Полное название страны',
  })
  name: string;

  @ApiProperty({
    example: 'BLR',
    description: 'Трёхбуквенное обозначение страны',
  })
  abbreviation: string;

  @ApiProperty({
    example: 49,
    description: 'Телефонный код страны',
  })
  phoneCode: number;

  @ApiPropertyOptional({
    example: '/icons/flags/de.svg',
    description: 'Путь к иконке флага страны',
  })
  iconPath?: string | null;
}

export class UserResponseDto {
  @ApiProperty({
    example: '6a8c5b1e-3e42-4e6f-bd22-8b7c2b5c91aa',
    description: 'Уникальный идентификатор пользователя',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  email: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'Логин пользователя',
  })
  login: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Имя пользователя',
  })
  name: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Роль пользователя',
  })
  role: UserRole;

  @ApiProperty({
    example: true,
    description: 'Статус аккаунта (true — активен)',
  })
  status: boolean;

  @ApiPropertyOptional({
    example: '+49123456789',
    nullable: true,
    description: 'Номер телефона пользователя',
  })
  phone: string | null;

  @ApiProperty({
    example: '2024-01-01T12:00:00.000Z',
    type: String,
    format: 'date-time',
    description: 'Дата создания пользователя',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    type: () => CountryResponseDto,
    nullable: true,
    description: 'Страна пользователя',
  })
  country?: CountryResponseDto | null;
}
