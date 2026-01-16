import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CountryEntity } from './country.entity';

// РОЛИ Пользователей
export enum UserRole {
  USER = 'user', // 1 - обычный пользователь
  ADMIN = 'admin', // 2 - админ
}

// ТЕМЫ сайта (настройка пользователя) (светлая/темная/авто)
export enum UserThemes {
  LIGHT = 'light', // 1 - светлая
  DARK = 'dark', // 2 - темная
  SYSTEM = 'system', // 3 - системная
}

// ПОДДЕРЖИВАЕМЫЕ ЯЗЫКИ ПОЛЬЗОВАТЕЛЯ
export enum UserLanguage {
  EN = 'en',
  PL = 'pl',
  RU = 'ru',
  DE = 'de',
}

@Entity('users')
export class UserEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Уникальный идентификатор пользователя',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя (уникальный)',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'Логин пользователя (уникальный)',
  })
  @Column({ unique: true })
  login: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Полное имя пользователя',
  })
  @Column()
  name: string;

  @ApiProperty({
    example: 'hashedpassword123',
    description: 'Хеш пароля пользователя',
  })
  @Column()
  password: string;

  @ApiProperty({
    example: UserRole.USER,
    description: 'Роль пользователя',
    enum: UserRole,
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    example: true,
    description: 'Статус активности пользователя',
  })
  @Column({ type: 'boolean', default: true })
  status: boolean;

  @ApiProperty({
    example: false,
    description: 'Статус подтверждения email',
  })
  @Column({ type: 'boolean', default: false })
  statusEmail: boolean;

  @ApiProperty({
    example: '501234567',
    description: 'Номер телефона пользователя без кода страны',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @ApiProperty({
    type: () => CountryEntity,
    description: 'Страна пользователя',
  })
  @ManyToOne(() => CountryEntity)
  @JoinColumn({ name: 'country_id' })
  country: CountryEntity;

  @ApiProperty({
    example: UserLanguage.EN,
    description: 'Язык интерфейса пользователя',
    enum: UserLanguage,
  })
  @Column({
    type: 'enum',
    enum: UserLanguage,
    default: UserLanguage.EN,
  })
  language: UserLanguage;

  @ApiProperty({
    example: UserThemes.LIGHT,
    description: 'Тема интерфейса пользователя',
    enum: UserThemes,
  })
  @Column({
    type: 'enum',
    enum: UserThemes,
    default: UserThemes.LIGHT,
  })
  theme: UserThemes;

  @ApiProperty({
    example: '2026-01-11T10:30:00.000Z',
    description: 'Дата создания пользователя',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2026-01-11T12:00:00.000Z',
    description: 'Дата последнего обновления пользователя',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
