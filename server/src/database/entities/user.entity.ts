import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
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
  // Иденитификатор
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Почта
  @Column({ unique: true })
  email: string;

  // Логин
  @Column({ unique: true })
  login: string;

  // Пароль (хеш)
  @Column()
  password: string;

  // Роль
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  // Статус
  @Column({ type: 'boolean', default: true })
  status: boolean; // true = активен, false = деактивирован

  @Column({ nullable: true })
  phone: string;

  @ManyToOne(() => CountryEntity, { nullable: true })
  @JoinColumn({ name: 'country_id' })
  country: CountryEntity;

  @Column({
    type: 'enum',
    enum: UserLanguage,
    default: UserLanguage.EN, // по умолчанию английский
  })
  language: UserLanguage;

  // Настройка темы
  @Column({
    type: 'enum',
    enum: UserThemes,
    default: UserThemes.LIGHT,
  })
  theme: UserThemes;

  // Дата создания
  @CreateDateColumn()
  createdAt: Date;

  // Дата обновления
  @UpdateDateColumn()
  updatedAt: Date;
}
