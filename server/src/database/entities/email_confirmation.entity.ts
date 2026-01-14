import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from './user.entity';

@Entity('email_confirmations')
export class EmailConfirmationEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Уникальный идентификатор подтверждения email',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '4f8b3c9d2e0f7a1b',
    description:
      'Случайный токен, который будет использоваться в ссылке подтверждения',
  })
  @Column({ unique: true })
  token: string;

  @ApiProperty({
    type: () => UserEntity,
    description: 'Пользователь, для которого создаётся подтверждение email',
  })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @ApiProperty({
    example: '2026-01-15T12:00:00.000Z',
    description: 'Дата и время, когда токен перестанет быть действителен',
  })
  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date;

  @ApiProperty({
    example: '2026-01-11T10:30:00.000Z',
    description: 'Дата и время создания записи',
  })
  @CreateDateColumn()
  createdAt: Date;
}
