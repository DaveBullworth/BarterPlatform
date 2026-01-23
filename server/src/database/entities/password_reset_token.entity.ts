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

@Entity('password_reset_tokens')
export class PasswordResetTokenEntity {
  @ApiProperty({
    example: 'a3c1d7e2-9f9a-4c4e-bf25-7c8b9c6e1234',
    description: 'Уникальный идентификатор токена сброса пароля',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: () => UserEntity,
    description: 'Пользователь, для которого был создан токен сброса пароля',
  })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ApiProperty({
    example: '5e884898da28047151d0e56f8dc6292773603d0d6aabbddf...',
    description:
      'Хеш токена сброса пароля (оригинальный токен никогда не хранится)',
  })
  @Column()
  tokenHash: string;

  @ApiProperty({
    example: '2026-01-11T12:30:00.000Z',
    description: 'Дата и время, до которых токен считается валидным',
  })
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @ApiProperty({
    example: false,
    description:
      'Флаг, указывающий был ли токен использован (true — токен более невалиден)',
  })
  @Column({ default: false })
  used: boolean;

  @ApiProperty({
    example: '2026-01-11T10:15:00.000Z',
    description: 'Дата и время создания токена сброса пароля',
  })
  @CreateDateColumn()
  createdAt: Date;
}
