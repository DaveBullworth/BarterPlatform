import { ApiProperty } from '@nestjs/swagger';
import {
  UserEntity,
  UserRole,
  UserLanguage,
  UserThemes,
} from '@/database/entities/user.entity';
import { CountryEntity } from '@/database/entities/country.entity';

export class AdminUserDto {
  @ApiProperty({
    example: 'uuid',
    description: 'Уникальный идентификатор пользователя',
  })
  id: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Роль пользователя',
  })
  role: UserRole;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  email: string;

  @ApiProperty({ example: 'userlogin', description: 'Логин пользователя' })
  login: string;

  @ApiProperty({ example: 'John Doe', description: 'Имя пользователя' })
  name: string;

  @ApiProperty({ example: '+1234567890', description: 'Телефон пользователя' })
  phone: string;

  @ApiProperty({
    type: () => CountryEntity,
    description: 'Страна пользователя',
  })
  country: CountryEntity;

  @ApiProperty({ example: true, description: 'Активность пользователя' })
  status: boolean;

  @ApiProperty({
    example: false,
    description: 'Подтверждён ли email пользователя',
  })
  statusEmail: boolean;

  @ApiProperty({
    example: '2025-12-30T12:00:00.000Z',
    description: 'Дата создания пользователя',
  })
  createdAt: Date;

  constructor(user: UserEntity) {
    Object.assign(this, {
      id: user.id,
      role: user.role,
      email: user.email,
      login: user.login,
      name: user.name,
      phone: user.phone,
      country: user.country,
      status: user.status,
      statusEmail: user.statusEmail,
      createdAt: user.createdAt,
    });
  }
}

export class SelfUserDto {
  @ApiProperty({
    example: 'uuid',
    description: 'Уникальный идентификатор пользователя',
  })
  id: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Роль пользователя',
  })
  role: UserRole;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  email: string;

  @ApiProperty({ example: 'userlogin', description: 'Логин пользователя' })
  login: string;

  @ApiProperty({ example: 'John Doe', description: 'Имя пользователя' })
  name: string;

  @ApiProperty({ example: '+1234567890', description: 'Телефон пользователя' })
  phone: string;

  @ApiProperty({
    type: () => CountryEntity,
    description: 'Страна пользователя',
  })
  country: CountryEntity;

  @ApiProperty({
    enum: UserLanguage,
    example: UserLanguage.RU,
    description: 'Язык пользователя',
  })
  language: UserLanguage;

  @ApiProperty({
    enum: UserThemes,
    example: UserThemes.DARK,
    description: 'Тема пользователя',
  })
  theme: UserThemes;

  @ApiProperty({
    example: '2025-12-30T12:00:00.000Z',
    description: 'Дата создания пользователя',
  })
  createdAt: Date;

  constructor(user: UserEntity) {
    Object.assign(this, {
      id: user.id,
      role: user.role,
      email: user.email,
      login: user.login,
      name: user.name,
      phone: user.phone,
      country: user.country,
      language: user.language,
      theme: user.theme,
      createdAt: user.createdAt,
    });
  }
}

export class PublicUserDto {
  @ApiProperty({
    example: 'uuid',
    description: 'Уникальный идентификатор пользователя',
  })
  id: string;

  @ApiProperty({ example: 'userlogin', description: 'Логин пользователя' })
  login: string;

  @ApiProperty({ example: 'John Doe', description: 'Имя пользователя' })
  name: string;

  @ApiProperty({
    type: () => CountryEntity,
    description: 'Страна пользователя',
  })
  country: CountryEntity;

  @ApiProperty({
    example: '2025-12-30T12:00:00.000Z',
    description: 'Дата создания пользователя',
  })
  createdAt: Date;

  constructor(user: UserEntity) {
    Object.assign(this, {
      id: user.id,
      login: user.login,
      name: user.name,
      country: user.country,
      createdAt: user.createdAt,
    });
  }
}
