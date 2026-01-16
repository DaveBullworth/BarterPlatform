import 'dotenv/config';
import { AppDataSource } from './data-source';
import { seedAdmin } from './seeds/admin.seed';
import { seedCountries } from './seeds/countries.seed';

export async function runSeeds() {
  try {
    // Если это прод то подключение уже будет от функции `prepareDatabase`
    if (process.env.NODE_ENV !== 'production') {
      await AppDataSource.initialize();
      console.log('📦 Database connected');
    }

    await seedCountries(AppDataSource);
    await seedAdmin(AppDataSource);

    // Если это прод то подключение не надо разрывать вручную, как если бы это было
    // при ручном запуске скрипта сидирования через `npm run seed`
    if (process.env.NODE_ENV !== 'production') {
      await AppDataSource.destroy();
    }
    console.log('🌱 Seeding finished');
  } catch (error) {
    console.error('❌ Seeding failed', error);
    process.exit(1);
  }
}

runSeeds().catch((err) => {
  console.error('Unhandled error in seed runner:', err);
});
