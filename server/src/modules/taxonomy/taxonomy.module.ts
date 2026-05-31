import { Module } from '@nestjs/common';
import { TaxonomyService } from '@/modules/lots/taxonomy.service';

/**
 * Лёгкий обёрточный модуль: TaxonomyService — статичный seed-ридер без БД.
 * Один инстанс должен переиспользоваться LotsModule и UserPreferencesModule.
 */
@Module({
  providers: [TaxonomyService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
