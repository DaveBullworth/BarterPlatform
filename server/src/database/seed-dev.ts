import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { seedDevData, wipeDevData } from './seeds/dev-data.seed';

/**
 * Дев-сидер тестовых данных. Запуск (внутри dev-контейнера сервера):
 *
 *   npm run seed:dev              — снести прошлый посев и засеять заново
 *   npm run seed:dev -- --wipe    — только очистить тестовые данные
 *   npm run seed:dev -- --no-images  — без генерации картинок (быстрее)
 *
 * Поднимает полный Nest-контекст, чтобы сидирование шло через реальные
 * сервисы со всей бизнес-логикой (см. dev-data.seed.ts).
 */
async function main() {
  const args = new Set(process.argv.slice(2));

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    await wipeDevData(app);
    if (!args.has('--wipe')) {
      await seedDevData(app, { withImages: !args.has('--no-images') });
    }
    console.log('🌱 Dev seeding finished');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('❌ Dev seeding failed', err);
  process.exit(1);
});
