import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { seedDevData, wipeDevData } from './seeds/dev-data.seed';

/**
 * Дев-сидер тестовых данных.
 *
 * Ручной запуск (внутри dev-контейнера сервера):
 *
 *   npm run seed:dev                 — снести прошлый посев и засеять заново
 *   npm run seed:dev -- --wipe       — только очистить тестовые данные
 *   npm run seed:dev -- --no-images  — без генерации картинок (быстрее)
 *
 * Автозапуск в проде: при SEED_DEV=true main() вызывается из prepareDatabase()
 * в main.ts (после миграций, до старта приложения). Без аргументов это значит
 * полный цикл wipe + seed.
 *
 * Поднимает полный Nest-контекст, чтобы сидирование шло через реальные
 * сервисы со всей бизнес-логикой (см. dev-data.seed.ts).
 */
export async function main(): Promise<void> {
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

// Авто-запуск только при ПРЯМОМ вызове скрипта (npm run seed:dev). При импорте
// из prepareDatabase() в проде этот блок пропускается — иначе main() выполнился
// бы дважды (на импорте модуля и явным вызовом из main.ts), и два параллельных
// Nest-контекста затёрли бы данные друг друга на wipe/seed.
if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Dev seeding failed', err);
    process.exit(1);
  });
}
