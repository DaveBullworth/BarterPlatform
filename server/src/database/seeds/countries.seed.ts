import { DataSource } from 'typeorm';
import { CountryEntity } from '../entities/country.entity';
import countries from './countries.json';

export async function seedCountries(dataSource: DataSource) {
  const repo = dataSource.getRepository(CountryEntity);

  // счётчик добавленных стран
  let addedCount = 0;

  for (const country of countries) {
    const exists = await repo.findOneBy({ abbreviation: country.abbreviation });
    if (!exists) {
      await repo.save(repo.create(country));
      addedCount++;
    }
  }

  console.log(
    `✅ Country seeding complete. Total new countries added: ${addedCount}`,
  );
}
