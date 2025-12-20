import 'dotenv/config';
import { AppDataSource } from './data-source';
import { seedAdmin } from './seeds/admin.seed';
import { seedCountries } from './seeds/countries.seed';

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log('📦 Database connected');

    await seedAdmin(AppDataSource);
    await seedCountries(AppDataSource);

    await AppDataSource.destroy();
    console.log('🌱 Seeding finished');
  } catch (error) {
    console.error('❌ Seeding failed', error);
    process.exit(1);
  }
}

runSeeds().catch((err) => {
  console.error('Unhandled error in seed runner:', err);
});
