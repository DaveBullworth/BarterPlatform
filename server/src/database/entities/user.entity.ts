import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum UserThemes {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum UserLanguage {
  EN = 'en',
  PL = 'pl',
  RU = 'ru',
  DE = 'de',
}

@Entity('users')
export class UserEntity {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: 'john_doe' })
  @Column({ unique: true })
  login: string;

  @ApiProperty({ example: 'John Doe' })
  @Column()
  name: string;

  @ApiProperty({ example: 'hashedpassword123' })
  @Column()
  password: string;

  @ApiProperty({ example: UserRole.USER, enum: UserRole })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  status: boolean;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  statusEmail: boolean;

  @ApiProperty({ example: '501234567', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @ApiProperty({ example: 5, nullable: true })
  @Column({ type: 'int', nullable: true })
  regionId: number | null;

  @ApiProperty({ example: 5003, nullable: true })
  @Column({ type: 'int', nullable: true })
  cityId: number | null;

  @ApiProperty({ example: 7002, nullable: true })
  @Column({ type: 'int', nullable: true })
  districtId: number | null;

  @ApiProperty({ example: UserLanguage.EN, enum: UserLanguage })
  @Column({ type: 'enum', enum: UserLanguage, default: UserLanguage.EN })
  language: UserLanguage;

  @ApiProperty({ example: UserThemes.LIGHT, enum: UserThemes })
  @Column({ type: 'enum', enum: UserThemes, default: UserThemes.LIGHT })
  theme: UserThemes;

  @ApiProperty({ example: '2026-01-11T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2026-01-11T12:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
