import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('sessions')
export class SessionEntity {
  // Иденитификатор
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Ссылка на пользователя
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  // Хеш refresh токена
  @Column({ type: 'text', nullable: true })
  refreshTokenHash: string | null;

  // IP адрес устройства
  @Column({ nullable: true })
  ip: string;

  // User-agent браузера / устройства
  @Column({ nullable: true })
  userAgent: string;

  // Дата создания сессии
  @CreateDateColumn()
  createdAt: Date;

  // Дата окончания сессии
  @Column({ type: 'timestamptz', nullable: false })
  expiresAt: Date;

  // Статус сессии (активна/неактивна)
  @Column({ default: true })
  status: boolean;
}
