import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { LotEntity, LotVisibilityStatus } from '@/database/entities/lot.entity';
import { UserRole } from '@/database/entities/user.entity';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { LotErrorCode } from './errors/lots-error-codes';
import { LotFiltersDto } from './dto/lotFilters.dto';
import { LotResponseDto } from './dto/getAllLots.dto';
import { applyTextFilter as applyTextFilterImported } from '@/common/utils/query-filters.util';
import { LotOneResponseDto } from './dto/getOneLot.dto';
import { LotArchiveService } from './lot-archive.service';
import { GeographyService } from '../users/geography.service';
import { UsersService } from '../users/users.service';
import { TaxonomyService } from './taxonomy.service';

const TAXONOMY_ID_FIELDS = [
  'chapterId',
  'categoryId',
  'subcategoryId',
] as const;

const GEO_ID_FIELDS = ['regionId', 'cityId', 'districtId'] as const;

type LotIdField =
  | (typeof TAXONOMY_ID_FIELDS)[number]
  | (typeof GEO_ID_FIELDS)[number];

/**
 * Контекст, который протаскивается через декомпозированные шаги построения
 * запроса getAll. Хранит сам QueryBuilder и распакованные флаги доступа.
 */
type LotQueryContext = {
  qb: SelectQueryBuilder<LotEntity>;
  user: JwtPayload | undefined;
  filters: LotFiltersDto | undefined;
  isAdmin: boolean;
  wantsSelfOnly: boolean;
};

@Injectable()
export class LotsService {
  constructor(
    @InjectRepository(LotEntity)
    private readonly lotsRepo: Repository<LotEntity>,
    private readonly lotArchiveService: LotArchiveService,
    private readonly geographyService: GeographyService,
    private readonly usersService: UsersService,
    private readonly taxonomyService: TaxonomyService,
  ) {}

  private applyTextFilter = applyTextFilterImported<LotEntity>;

  private applyLotIdFilter(
    qb: SelectQueryBuilder<LotEntity>,
    field: LotIdField,
    value: string,
  ) {
    const id = Number(value);
    if (!Number.isFinite(id)) return;

    qb.andWhere(`lot.${field} = :${field}`, {
      [field]: id,
    });
  }

  async create(dto: CreateLotDto, user: JwtPayload) {
    this.taxonomyService.validate(
      dto.chapterId,
      dto.categoryId,
      dto.subcategoryId,
    );

    this.geographyService.validate(
      dto.regionId,
      dto.cityId,
      dto.districtId ?? null,
    );

    const lot = this.lotsRepo.create({
      userId: user.sub,
      chapterId: dto.chapterId,
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId ?? null,
      generalDescription: dto.generalDescription,
      characteristicsDescription: dto.characteristicsDescription,
      quantity: dto.quantity,
      visibilityStatus: dto.visibilityStatus,
      regionId: dto.regionId,
      cityId: dto.cityId,
      districtId: dto.districtId ?? null,
    });

    const createdLot = await this.lotsRepo.save(lot);

    const geo = this.geographyService.build({
      regionId: createdLot.regionId,
      cityId: createdLot.cityId,
      districtId: createdLot.districtId ?? null,
    });

    return {
      ...createdLot,
      region: geo.region,
      city: geo.city,
      district: geo.district,
      archivationDate: null,
    };
  }

  async getAll(params: {
    page: number;
    limit: number;
    filters?: LotFiltersDto;
    user?: JwtPayload;
  }): Promise<{ data: LotResponseDto[]; total: number }> {
    const { page, limit } = params;

    const ctx = this.buildLotQueryContext(params);

    this.applyVisibilityScope(ctx);
    this.applyIdFilters(ctx);
    this.applyTextSearch(ctx);
    await this.applyRecommendationOrder(ctx);
    this.applyPagination(ctx, page, limit);

    const [lots, total] = await ctx.qb.getManyAndCount();

    return {
      total,
      data: lots.map((lot) => this.toResponseDto(lot)),
    };
  }

  private buildLotQueryContext(params: {
    filters?: LotFiltersDto;
    user?: JwtPayload;
  }): LotQueryContext {
    const { filters, user } = params;
    return {
      qb: this.lotsRepo.createQueryBuilder('lot'),
      user,
      filters,
      isAdmin: user?.role === UserRole.ADMIN,
      wantsSelfOnly: Boolean(user && filters?.selfOnly),
    };
  }

  /**
   * Базовая логика доступа и видимости:
   *  - Гость: только активные публичные лоты.
   *  - selfOnly: всегда отдаёт лоты текущего пользователя (включая скрытые/архивные).
   *  - ADMIN без selfOnly: видит абсолютно все лоты.
   *  - Авторизованный USER без selfOnly: только активные чужие лоты.
   */
  private applyVisibilityScope(ctx: LotQueryContext) {
    const { qb, user, isAdmin, wantsSelfOnly } = ctx;

    if (!user) {
      qb.andWhere('lot.visibilityStatus = :active', {
        active: LotVisibilityStatus.ACTIVE,
      });
      return;
    }

    if (wantsSelfOnly) {
      qb.andWhere('lot.userId = :userId', { userId: user.sub });
      return;
    }

    if (!isAdmin) {
      qb.andWhere('lot.visibilityStatus = :active AND lot.userId != :userId', {
        active: LotVisibilityStatus.ACTIVE,
        userId: user.sub,
      });
    }
    // ADMIN без selfOnly — без andWhere, видит всё.
  }

  private applyIdFilters(ctx: LotQueryContext) {
    const { qb, filters } = ctx;
    if (!filters) return;

    for (const field of [...TAXONOMY_ID_FIELDS, ...GEO_ID_FIELDS] as const) {
      const filter = filters[field];
      if (filter) {
        this.applyLotIdFilter(qb, field, filter.value);
      }
    }
  }

  private applyTextSearch(ctx: LotQueryContext) {
    const { qb, filters } = ctx;
    if (!filters?.query) return;
    this.applyTextFilter(qb, 'lot.generalDescription', filters.query, 'query');
  }

  /**
   * Рекомендационная сортировка. Применяется только для авторизованных
   * пользователей, не использующих selfOnly. Состоит из двух независимых
   * приоритетов:
   *  1) taxonomy_score = sub*100 + cat*10 + chp  — если нет фильтров taxonomy
   *  2) geo_score (3/2/1/0) по совпадению district/city/region пользователя — если нет фильтров гео
   * Fallback всегда — lot.createdAt DESC.
   *
   * Важно: TypeORM в режиме skip/take + joins сплитит выражения ORDER BY по
   * точке, чтобы переписать их через подзапрос пагинации. Чтобы это не
   * валило сложные выражения вроде "COALESCE(chp_pref.weight, 0)", регистрируем
   * их через addSelect с алиасами без точек ('tax_score', 'geo_score') и
   * упорядочиваем по этим алиасам.
   */
  private async applyRecommendationOrder(ctx: LotQueryContext) {
    const { qb, user, filters, wantsSelfOnly } = ctx;

    if (!user || wantsSelfOnly) {
      qb.orderBy('lot.createdAt', 'DESC');
      return;
    }

    const hasTaxonomyFilter = TAXONOMY_ID_FIELDS.some(
      (field) => filters?.[field],
    );
    const hasGeoFilter = GEO_ID_FIELDS.some((field) => filters?.[field]);

    let firstOrder = true;
    const addOrder = (expr: string, dir: 'ASC' | 'DESC') => {
      if (firstOrder) {
        qb.orderBy(expr, dir);
        firstOrder = false;
      } else {
        qb.addOrderBy(expr, dir);
      }
    };

    if (!hasTaxonomyFilter) {
      this.joinTaxonomyPreferences(qb, user.sub);
      qb.addSelect(
        `COALESCE(chp_pref.weight, 0) + COALESCE(cat_pref.weight, 0) * 10 + COALESCE(sub_pref.weight, 0) * 100`,
        'tax_score',
      );
      addOrder('tax_score', 'DESC');
    }

    if (!hasGeoFilter) {
      const geo = await this.usersService.findGeoById(user.sub);
      const hasAnyGeo = Boolean(
        geo && (geo.regionId || geo.cityId || geo.districtId),
      );
      if (hasAnyGeo && geo) {
        qb.setParameter('uRegion', geo.regionId);
        qb.setParameter('uCity', geo.cityId);
        qb.setParameter('uDistrict', geo.districtId);
        qb.addSelect(
          `CASE
            WHEN lot."districtId" IS NOT NULL AND lot."districtId" = :uDistrict THEN 3
            WHEN lot."cityId" = :uCity THEN 2
            WHEN lot."regionId" = :uRegion THEN 1
            ELSE 0
          END`,
          'geo_score',
        );
        addOrder('geo_score', 'DESC');
      }
    }

    addOrder('lot.createdAt', 'DESC');
  }

  private joinTaxonomyPreferences(
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

  private applyPagination(ctx: LotQueryContext, page: number, limit: number) {
    ctx.qb.skip((page - 1) * limit).take(limit);
  }

  private toResponseDto(lot: LotEntity): LotResponseDto {
    const geo = this.geographyService.build({
      regionId: lot.regionId,
      cityId: lot.cityId,
      districtId: lot.districtId ?? null,
    });

    return {
      id: lot.id,
      chapterId: lot.chapterId,
      categoryId: lot.categoryId,
      subcategoryId: lot.subcategoryId ?? undefined,
      generalDescription: lot.generalDescription,
      characteristicsDescription: lot.characteristicsDescription,
      quantity: lot.quantity,
      visibilityStatus: lot.visibilityStatus,
      region: geo.region,
      city: geo.city,
      district: geo.district,
      archivationDate: lot.archivationDate,
      createdAt: lot.createdAt,
      updatedAt: lot.updatedAt,
      imageLinks: lot.imageLinks ?? [],
    };
  }

  async getOne(id: string, user?: JwtPayload): Promise<LotOneResponseDto> {
    const lot = await this.lotsRepo.findOne({ where: { id } });
    if (!lot)
      throw new NotFoundException({
        code: LotErrorCode.LOT_NOT_FOND,
        message: 'Lot not found',
      });

    if (!user) {
      if (lot.visibilityStatus !== LotVisibilityStatus.ACTIVE) {
        throw new ForbiddenException({
          code: LotErrorCode.NO_ACCESS,
          message: 'No access to this lot',
        });
      }
    } else if (
      user.role !== UserRole.ADMIN &&
      lot.userId !== user.sub &&
      lot.visibilityStatus !== LotVisibilityStatus.ACTIVE
    ) {
      throw new ForbiddenException({
        code: LotErrorCode.NO_ACCESS,
        message: 'No access to this lot',
      });
    }

    let archivationDate: Date | null = null;

    if (lot.visibilityStatus === LotVisibilityStatus.ARCHIVED) {
      archivationDate = await this.lotArchiveService.getArchivationDate(lot.id);
    }

    return {
      ...this.toResponseDto(lot),
      userId: lot.userId,
      archivationDate: archivationDate ? archivationDate.toISOString() : null,
    };
  }

  async update(id: string, dto: UpdateLotDto, user: JwtPayload) {
    const lot = await this.lotsRepo.findOne({ where: { id } });
    if (!lot)
      throw new NotFoundException({
        code: LotErrorCode.LOT_NOT_FOND,
        message: 'Lot not found',
      });

    const isAdmin = user.role === UserRole.ADMIN;
    if (!isAdmin) {
      if (lot.userId !== user.sub) {
        throw new ForbiddenException({
          code: LotErrorCode.NOT_OWNER,
          message: 'Only owner can update lot',
        });
      }

      const isArchived = lot.visibilityStatus === LotVisibilityStatus.ARCHIVED;
      const wantsUnarchive =
        dto.visibilityStatus === LotVisibilityStatus.ACTIVE;

      if (isArchived && !wantsUnarchive) {
        throw new ForbiddenException({
          code: LotErrorCode.USER_ARCHIVED,
          message: 'Archived lots cannot be edited by user',
        });
      }
    }

    const previousStatus = lot.visibilityStatus;
    const chapterId = dto.chapterId ?? lot.chapterId;
    const categoryId = dto.categoryId ?? lot.categoryId;
    const subcategoryId = dto.subcategoryId ?? lot.subcategoryId ?? undefined;

    const nextRegionId = dto.regionId ?? lot.regionId;
    const nextCityId = dto.cityId ?? lot.cityId;
    const nextDistrictId =
      dto.districtId !== undefined ? dto.districtId : lot.districtId;

    this.taxonomyService.validate(chapterId, categoryId, subcategoryId);

    if (nextRegionId && nextCityId) {
      this.geographyService.validate(
        nextRegionId,
        nextCityId,
        nextDistrictId ?? null,
      );
    }

    Object.assign(lot, {
      chapterId,
      categoryId,
      subcategoryId: dto.subcategoryId ?? lot.subcategoryId,
      generalDescription: dto.generalDescription ?? lot.generalDescription,
      characteristicsDescription:
        dto.characteristicsDescription ?? lot.characteristicsDescription,
      quantity: dto.quantity ?? lot.quantity,
      visibilityStatus: dto.visibilityStatus ?? lot.visibilityStatus,
      regionId: dto.regionId ?? lot.regionId,
      cityId: dto.cityId ?? lot.cityId,
      districtId: dto.districtId ?? lot.districtId,
    });

    const savedLot = await this.lotsRepo.save(lot);
    let archivationDate = await this.lotArchiveService.sync(
      savedLot.id,
      previousStatus,
      savedLot.visibilityStatus,
    );

    if (
      previousStatus === LotVisibilityStatus.ARCHIVED &&
      savedLot.visibilityStatus === LotVisibilityStatus.ARCHIVED
    ) {
      archivationDate = await this.lotArchiveService.getArchivationDate(
        savedLot.id,
      );
    }

    const geo = this.geographyService.build({
      regionId: lot.regionId,
      cityId: lot.cityId,
      districtId: lot.districtId ?? null,
    });

    return {
      ...savedLot,
      region: geo.region,
      city: geo.city,
      district: geo.district,
      archivationDate: archivationDate ? archivationDate.toISOString() : null,
    };
  }

  async remove(id: string, user: JwtPayload) {
    const lot = await this.lotsRepo.findOne({ where: { id } });
    if (!lot)
      throw new NotFoundException({
        code: LotErrorCode.LOT_NOT_FOND,
        message: 'Lot not found',
      });

    const isAdmin = user.role === UserRole.ADMIN;
    if (!isAdmin)
      throw new ForbiddenException({
        code: LotErrorCode.NO_ACCESS,
        message: 'Only admin can delete lot',
      });

    await this.lotsRepo.remove(lot);
    await this.lotArchiveService.remove(lot.id);

    return { success: true };
  }
}
