import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// РОЛИ Пользователей
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

// СТАТУСЫ Пользователей (для деактивации аккков)
export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

// ТЕМЫ сайта (настройка пользователя) (светлая/темная/авто)
export enum UserThemes {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  login: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: UserThemes,
    default: UserThemes.LIGHT,
  })
  theme: UserThemes;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
