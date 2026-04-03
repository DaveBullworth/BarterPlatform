import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from './user.entity';

@Entity('account_deactivation_codes')
@Index(['user', 'createdAt'])
export class AccountDeactivationCodeEntity {
  @ApiProperty({
    example: 'b2e5c4f3-6d9a-4e8b-9c91-7f1e5c0a1234',
    description: 'Уникальный идентификатор кода деактивации аккаунта',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    type: () => UserEntity,
    description: 'Пользователь, запросивший деактивацию аккаунта',
  })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ApiProperty({
    example: '9f86d081884c7d659a2feaa0c55ad015...',
    description:
      'Хеш 6-значного кода деактивации (оригинальный код не хранится)',
  })
  @Column()
  codeHash!: string;

  @ApiProperty({
    example: '2026-01-29T12:00:00.000Z',
    description: 'Дата и время, до которых код считается валидным',
  })
  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @ApiProperty({
    example: false,
    description: 'Флаг, указывающий был ли код использован',
  })
  @Column({ default: false })
  used!: boolean;

  @ApiProperty({
    example: '2026-01-29T10:00:00.000Z',
    description: 'Дата и время создания кода деактивации',
  })
  @CreateDateColumn()
  createdAt!: Date;
}
