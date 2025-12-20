import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('countries')
export class CountryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true, length: 3 })
  abbreviation: string;

  @Column()
  phoneCode: number;

  @Column({ nullable: true })
  iconPath: string; // путь до SVG, например '/static/icons/flags/rus.svg'
}
