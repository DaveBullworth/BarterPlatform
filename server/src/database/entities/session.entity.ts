import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from './user.entity';

@Entity('sessions')
export class SessionEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Уникальный идентификатор сессии',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: () => UserEntity,
    description: 'Пользователь, которому принадлежит сессия',
  })
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ApiProperty({
    example: 'b1a2c3d4e5f6...',
    description: 'Хеш refresh-токена (если сессия активна)',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  refreshTokenHash: string | null;

  @ApiProperty({
    example: '192.168.1.1',
    description: 'IP адрес устройства, с которого создана сессия',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  ip: string | null;

  @ApiProperty({
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
    description: 'User-agent браузера или устройства',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @ApiProperty({
    example: '2026-01-11T10:30:00.000Z',
    description: 'Дата и время создания сессии',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2026-01-18T10:30:00.000Z',
    description: 'Дата и время окончания сессии',
  })
  @Column({ type: 'timestamptz', nullable: false })
  expiresAt: Date;

  @ApiProperty({
    example: true,
    description: 'Статус сессии: true = активна, false = неактивна',
  })
  @Column({ default: true })
  status: boolean;
}
