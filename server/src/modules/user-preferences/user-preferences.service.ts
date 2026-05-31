import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { UserTaxonomyPreferenceEntity } from '@/database/entities/user-taxonomy-preference.entity';
import { TaxonomyService } from '@/modules/lots/taxonomy.service';
import { UpsertPreferenceItemDto } from './dto/upsert-preferences.dto';
import { UserPreferenceErrorCode } from './errors/user-preferences-error-codes';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserTaxonomyPreferenceEntity)
    private readonly preferencesRepo: Repository<UserTaxonomyPreferenceEntity>,
    private readonly taxonomyService: TaxonomyService,
    private readonly dataSource: DataSource,
  ) {}

  async getByUser(userId: string) {
    const rows = await this.preferencesRepo.find({
      where: { userId },
      select: ['targetType', 'targetId', 'weight'],
    });
    return rows.map((row) => ({
      targetType: row.targetType,
      targetId: row.targetId,
      weight: row.weight,
    }));
  }

  /**
   * Заменяет ВЕСЬ набор предпочтений пользователя на присланный — пустой массив
   * эквивалентен reset(). Делает delete + bulk insert в одной транзакции,
   * чтобы не оставлять "обрывки" при ошибке.
   */
  async replaceAll(userId: string, items: UpsertPreferenceItemDto[]) {
    this.validateItems(items);

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(UserTaxonomyPreferenceEntity);
      await repo.delete({ userId });

      if (items.length === 0) return;

      const entities = items.map((item) =>
        repo.create({
          userId,
          targetType: item.targetType,
          targetId: item.targetId,
          weight: item.weight,
        }),
      );

      await repo.save(entities, { chunk: 500 });
    });

    return this.getByUser(userId);
  }

  async reset(userId: string) {
    await this.preferencesRepo.delete({ userId });
    return { success: true };
  }

  /**
   * Проставляет вес 1 на все доступные узлы таксономии (chapter+category+subcategory).
   * Использует тот же replaceAll, чтобы не плодить логику.
   */
  async selectAll(userId: string) {
    const items: UpsertPreferenceItemDto[] = this.taxonomyService
      .listAllTargets()
      .map((target) => ({
        targetType: target.targetType,
        targetId: target.targetId,
        weight: 1 as const,
      }));

    return this.replaceAll(userId, items);
  }

  private validateItems(items: UpsertPreferenceItemDto[]) {
    const seen = new Set<string>();
    for (const item of items) {
      const key = `${item.targetType}:${item.targetId}`;
      if (seen.has(key)) {
        throw new BadRequestException({
          code: UserPreferenceErrorCode.INVALID_TARGET,
          message: `Duplicate preference target: ${key}`,
        });
      }
      seen.add(key);

      if (!this.taxonomyService.targetExists(item.targetType, item.targetId)) {
        throw new BadRequestException({
          code: UserPreferenceErrorCode.INVALID_TARGET,
          message: `Unknown taxonomy target: ${item.targetType}:${item.targetId}`,
        });
      }
    }
  }

}
