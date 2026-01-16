import { DataSource } from 'typeorm';
import { CountryEntity } from '../entities/country.entity';
import countries from './countries.json';

export async function seedCountries(dataSource: DataSource) {
  const repo = dataSource.getRepository(CountryEntity);

  await repo.upsert(countries, ['name']);

  console.log(`✅ Country seeding complete`);
}
