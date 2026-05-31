import { ApiProperty } from '@nestjs/swagger';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TaxonomyTargetType {
  CHAPTER = 'chapter',
  CATEGORY = 'category',
  SUBCATEGORY = 'subcategory',
}

export type TaxonomyPreferenceWeight = 1 | 2 | 3;

@Entity('user_taxonomy_preferences')
@Index('UQ_user_taxonomy_preferences_target', ['userId', 'targetType', 'targetId'], {
  unique: true,
})
@Index('IDX_user_taxonomy_preferences_user_type', ['userId', 'targetType'])
@Check('CHK_user_taxonomy_preferences_weight', '"weight" BETWEEN 1 AND 3')
export class UserTaxonomyPreferenceEntity {
  @ApiProperty({ example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Column({ type: 'uuid' })
  userId!: string;

  @ApiProperty({ enum: TaxonomyTargetType, example: TaxonomyTargetType.SUBCATEGORY })
  @Column({ type: 'enum', enum: TaxonomyTargetType })
  targetType!: TaxonomyTargetType;

  @ApiProperty({
    example: 101,
    description: 'External taxonomy id (chapterId | categoryId | subcategoryId)',
  })
  @Column({ type: 'int' })
  targetId!: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 3 })
  @Column({ type: 'smallint' })
  weight!: TaxonomyPreferenceWeight;

  @ApiProperty({ example: '2026-05-25T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-25T12:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt!: Date;
}
