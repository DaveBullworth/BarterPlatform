import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('countries')
export class CountryEntity {
  // Иденитификатор
  @ApiProperty({
    example: 1,
    description: 'Уникальный идентификатор страны',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Название
  @ApiProperty({
    example: 'Poland',
    description: 'Название страны',
  })
  @Column({ unique: true })
  name: string;

  // Трехбуквенная аббревиатура
  @ApiProperty({
    example: 'POL',
    description: 'Трёхбуквенный код страны',
    minLength: 3,
    maxLength: 3,
  })
  @Column({ unique: true, length: 3 })
  abbreviation: string;

  // Код номеров телефона
  @ApiProperty({
    example: 48,
    description: 'Международный телефонный код страны без знака "+"',
  })
  @Column()
  phoneCode: number;

  // Путь до файла .svg иконки страны
  @ApiProperty({
    example: '/public/icons/flags/pol.svg',
    description: 'Относительный путь к SVG-иконке флага страны',
    nullable: true,
  })
  @Column({ nullable: true })
  iconPath: string | null; // путь до SVG
}
