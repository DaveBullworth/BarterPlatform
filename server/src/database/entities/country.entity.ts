import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('countries')
export class CountryEntity {
  // Иденитификатор
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Название
  @Column({ unique: true })
  name: string;

  // Трехбуквенная аббревиатура
  @Column({ unique: true, length: 3 })
  abbreviation: string;

  // Код номеров телефона
  @Column()
  phoneCode: number;

  // Путь до файла .svg иконки страны
  @Column({ nullable: true })
  iconPath: string; // путь до SVG, например '/static/icons/flags/rus.svg'
}
