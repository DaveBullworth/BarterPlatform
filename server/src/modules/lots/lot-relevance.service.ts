import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { LotEntity, LotVisibilityStatus } from '@/database/entities/lot.entity';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';

/**
 * Декомпозиция рекомендательной сортировки ленты лотов.
 *
 * Релевантность лота для смотрящего пользователя складывается из трёх слоёв:
 *
 *  1. ГЕО — базовый и САМЫЙ важный слой. Сортируется строго первым
 *     (лексикографически), поэтому лот в одном городе всегда релевантнее лота
 *     из другой области, даже если по интересам тот подходит идеально.
 *
 *  2. AFFINITY — взаимный «бартерный» интерес, два равноправных под-слоя,
 *     складываемых в одну шкалу:
 *       • want  — «я хочу твой лот»: предпочтения смотрящего ↔ таксономия лота.
 *       • offer — «ты хочешь моё»: предпочтения владельца лота ↔ категории, в
 *         которых у смотрящего есть СВОИ активные лоты.
 *     Чем сильнее совпадение в обе стороны — тем выше affinity.
 *
 *  3. createdAt — финальный тай-брейк (свежесть).
 *
 * Веса уровней таксономии общие для обоих направлений, чтобы слои находились на
 * одной шкале: совпадение по более узкому уровню ценится выше.
 */
const TAXONOMY_LEVEL_WEIGHT = {
  chapter: 1,
  category: 10,
  subcategory: 100,
} as const;

/** Максимум «я хочу твой лот»: вес 3 на всех трёх уровнях (3 + 30 + 300). */
const MAX_WANT_SCORE =
  3 *
  (TAXONOMY_LEVEL_WEIGHT.chapter +
    TAXONOMY_LEVEL_WEIGHT.category +
    TAXONOMY_LEVEL_WEIGHT.subcategory);

/** Максимум «ты хочешь моё»: лучший единичный хит — подкатегория с весом 3. */
const MAX_OFFER_SCORE = 3 * TAXONOMY_LEVEL_WEIGHT.subcategory;

/** Сколько ступеней свечения отдаём на клиент (0 = нет совпадения). */
const GLOW_MAX_LEVEL = 5;

/**
 * Какие слои реально попали в запрос — нужно и для построения ORDER BY, и чтобы
 * корректно нормировать affinity при вычислении уровня свечения.
 */
export type RelevancePlan = {
  enabled: boolean;
  hasGeo: boolean;
  hasWant: boolean;
  hasOffer: boolean;
};

type ViewerGeo = {
  regionId: number | null;
  cityId: number | null;
  districtId: number | null;
};

type ViewerContext = {
  geo: ViewerGeo | null;
  chapterIds: number[];
  categoryIds: number[];
  subcategoryIds: number[];
};

@Injectable()
export class LotRelevanceService {
  constructor(
    @InjectRepository(LotEntity)
    private readonly lotsRepo: Repository<LotEntity>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Навешивает на QueryBuilder скоринговые addSelect-ы и ORDER BY.
   * Возвращает план применённых слоёв (для computeLevel).
   *
   * Скоринговые выражения регистрируются через addSelect с алиасами без точек
   * ('geo_score', 'affinity_score') и сортировка идёт по этим алиасам — иначе
   * TypeORM в режиме skip/take + joins ломает ORDER BY, разбивая выражения по
   * точке при переписывании в подзапрос пагинации.
   */
  async applyOrder(
    qb: SelectQueryBuilder<LotEntity>,
    params: {
      user?: JwtPayload;
      wantsSelfOnly: boolean;
      hasTaxonomyFilter: boolean;
      hasGeoFilter: boolean;
    },
  ): Promise<RelevancePlan> {
    const { user, wantsSelfOnly, hasTaxonomyFilter, hasGeoFilter } = params;

    const plan: RelevancePlan = {
      enabled: false,
      hasGeo: false,
      hasWant: false,
      hasOffer: false,
    };

    // Рекомендации — только для авторизованного пользователя в общей ленте.
    // Гость / режим «Мои лоты» — обычная сортировка по свежести.
    if (!user || wantsSelfOnly) {
      qb.orderBy('lot.createdAt', 'DESC');
      return plan;
    }
    plan.enabled = true;

    const viewer = await this.buildViewerContext(user.sub);
    const orderAliases: string[] = [];

    // 1) ГЕО — строго доминирующий первый ключ сортировки.
    if (!hasGeoFilter && this.hasAnyGeo(viewer.geo)) {
      qb.setParameter('uRegion', viewer.geo.regionId);
      qb.setParameter('uCity', viewer.geo.cityId);
      qb.setParameter('uDistrict', viewer.geo.districtId);
      qb.addSelect(this.geoScoreSql(), 'geo_score');
      plan.hasGeo = true;
      orderAliases.push('geo_score');
    }

    // 2) AFFINITY = want + offer (два слоя складываются поровну в одну шкалу).
    const affinityParts: string[] = [];

    if (!hasTaxonomyFilter) {
      this.joinViewerPreferences(qb, user.sub);
      affinityParts.push(this.wantScoreSql());
      plan.hasWant = true;
    }

    const offerSql = this.offerScoreSql(viewer);
    if (offerSql) {
      affinityParts.push(offerSql);
      plan.hasOffer = true;
    }

    if (affinityParts.length > 0) {
      qb.addSelect(`(${affinityParts.join(' + ')})`, 'affinity_score');
      orderAliases.push('affinity_score');
    }

    // 3) Применяем ключи лексикографически + свежесть в самом конце.
    if (orderAliases.length === 0) {
      qb.orderBy('lot.createdAt', 'DESC');
    } else {
      qb.orderBy(orderAliases[0], 'DESC');
      for (let i = 1; i < orderAliases.length; i += 1) {
        qb.addOrderBy(orderAliases[i], 'DESC');
      }
      qb.addOrderBy('lot.createdAt', 'DESC');
    }

    return plan;
  }

  /**
   * Переводит сырой affinity_score строки в уровень свечения 0..5.
   * Гео в свечении НЕ участвует: гео определяет ПОРЯДОК ленты, а свечение
   * подсвечивает именно силу взаимного бартерного интереса.
   */
  computeLevel(
    raw: Record<string, unknown> | undefined,
    plan: RelevancePlan,
  ): number {
    if (!plan.enabled) return 0;

    let maxAffinity = 0;
    if (plan.hasWant) maxAffinity += MAX_WANT_SCORE;
    if (plan.hasOffer) maxAffinity += MAX_OFFER_SCORE;
    if (maxAffinity <= 0) return 0;

    const affinity = this.toNumber(raw?.['affinity_score']);
    if (affinity <= 0) return 0;

    const normalized = Math.min(affinity / maxAffinity, 1);
    return Math.min(
      GLOW_MAX_LEVEL,
      Math.max(1, Math.ceil(normalized * GLOW_MAX_LEVEL)),
    );
  }

  // ───────────────────────── helpers ─────────────────────────

  /**
   * Гео смотрящего + множества узлов таксономии, в которых у него есть СВОИ
   * активные лоты (его «товар» для бартера). Именно по этим узлам владельцы
   * чужих лотов могут «хотеть» что-то у смотрящего (offer-направление).
   */
  private async buildViewerContext(userId: string): Promise<ViewerContext> {
    const [geo, rows] = await Promise.all([
      this.usersService.findGeoById(userId),
      this.lotsRepo.find({
        where: { userId, visibilityStatus: LotVisibilityStatus.ACTIVE },
        select: ['chapterId', 'categoryId', 'subcategoryId'],
      }),
    ]);

    const chapterIds = new Set<number>();
    const categoryIds = new Set<number>();
    const subcategoryIds = new Set<number>();
    for (const row of rows) {
      chapterIds.add(row.chapterId);
      categoryIds.add(row.categoryId);
      if (row.subcategoryId != null) subcategoryIds.add(row.subcategoryId);
    }

    return {
      geo,
      chapterIds: [...chapterIds],
      categoryIds: [...categoryIds],
      subcategoryIds: [...subcategoryIds],
    };
  }

  private hasAnyGeo(geo: ViewerGeo | null): geo is ViewerGeo {
    return Boolean(geo && (geo.regionId || geo.cityId || geo.districtId));
  }

  private geoScoreSql(): string {
    return `CASE
      WHEN lot."districtId" IS NOT NULL AND lot."districtId" = :uDistrict THEN 3
      WHEN lot."cityId" = :uCity THEN 2
      WHEN lot."regionId" = :uRegion THEN 1
      ELSE 0
    END`;
  }

  private joinViewerPreferences(
    qb: SelectQueryBuilder<LotEntity>,
    userId: string,
  ) {
    qb.setParameter('recUserId', userId);

    qb.leftJoin(
      'user_taxonomy_preferences',
      'chp_pref',
      `chp_pref."userId" = :recUserId
        AND chp_pref."targetType" = 'chapter'
        AND chp_pref."targetId" = lot."chapterId"`,
    );
    qb.leftJoin(
      'user_taxonomy_preferences',
      'cat_pref',
      `cat_pref."userId" = :recUserId
        AND cat_pref."targetType" = 'category'
        AND cat_pref."targetId" = lot."categoryId"`,
    );
    qb.leftJoin(
      'user_taxonomy_preferences',
      'sub_pref',
      `sub_pref."userId" = :recUserId
        AND sub_pref."targetType" = 'subcategory'
        AND sub_pref."targetId" = lot."subcategoryId"`,
    );
  }

  /** «Я хочу твой лот»: вес предпочтений смотрящего на таксономии лота. */
  private wantScoreSql(): string {
    return `COALESCE(chp_pref.weight, 0) * ${TAXONOMY_LEVEL_WEIGHT.chapter}
      + COALESCE(cat_pref.weight, 0) * ${TAXONOMY_LEVEL_WEIGHT.category}
      + COALESCE(sub_pref.weight, 0) * ${TAXONOMY_LEVEL_WEIGHT.subcategory}`;
  }

  /**
   * «Ты хочешь моё»: лучший хит предпочтений ВЛАДЕЛЬЦА лота по узлам, в которых
   * у смотрящего есть свои активные лоты. Коррелированный скалярный подзапрос —
   * чтобы не размножать строки JOIN-ом и не ломать гидрацию сущностей.
   *
   * id-шники таксономии — это int-колонки из БД (доверенные числа), поэтому
   * инлайним их в IN(...) напрямую: так избегаем неоднозначности с раскрытием
   * spread-параметров (:...) внутри SELECT-подзапроса.
   */
  private offerScoreSql(viewer: ViewerContext): string | null {
    const clauses: string[] = [];

    const chapters = this.toIntList(viewer.chapterIds);
    const categories = this.toIntList(viewer.categoryIds);
    const subcategories = this.toIntList(viewer.subcategoryIds);

    if (chapters) {
      clauses.push(
        `(otp."targetType" = 'chapter' AND otp."targetId" IN (${chapters}))`,
      );
    }
    if (categories) {
      clauses.push(
        `(otp."targetType" = 'category' AND otp."targetId" IN (${categories}))`,
      );
    }
    if (subcategories) {
      clauses.push(
        `(otp."targetType" = 'subcategory' AND otp."targetId" IN (${subcategories}))`,
      );
    }

    if (clauses.length === 0) return null;

    return `COALESCE((
      SELECT MAX(otp.weight * (CASE otp."targetType"
          WHEN 'subcategory' THEN ${TAXONOMY_LEVEL_WEIGHT.subcategory}
          WHEN 'category' THEN ${TAXONOMY_LEVEL_WEIGHT.category}
          ELSE ${TAXONOMY_LEVEL_WEIGHT.chapter} END))
      FROM user_taxonomy_preferences otp
      WHERE otp."userId" = lot."userId" AND (${clauses.join(' OR ')})
    ), 0)`;
  }

  /** Безопасно превращает массив id в список целых для IN(...). */
  private toIntList(ids: number[]): string {
    return ids
      .map((id) => Math.trunc(id))
      .filter((id) => Number.isFinite(id))
      .join(', ');
  }

  private toNumber(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  }
}
