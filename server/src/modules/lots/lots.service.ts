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
import { TaxonomyService } from './taxonomy.service';
import { LotRelevanceService } from './lot-relevance.service';
import { NotificationsService } from '../notifications/notifications.service';
import { notificationBuilders } from '../notifications/notification.builders';

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
    private readonly taxonomyService: TaxonomyService,
    private readonly relevanceService: LotRelevanceService,
    private readonly notificationsService: NotificationsService,
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

    const plan = await this.relevanceService.applyOrder(ctx.qb, {
      user: ctx.user,
      wantsSelfOnly: ctx.wantsSelfOnly,
      hasTaxonomyFilter: TAXONOMY_ID_FIELDS.some(
        (field) => ctx.filters?.[field],
      ),
      hasGeoFilter: GEO_ID_FIELDS.some((field) => ctx.filters?.[field]),
    });

    this.applyPagination(ctx, page, limit);

    // entities — это лоты, raw — те же строки, но со скоринговыми колонками,
    // из которых берём relevanceLevel (в саму сущность они не попадают).
    const { entities, raw } = await ctx.qb.getRawAndEntities();
    const rawRows = raw as Array<Record<string, unknown>>;
    const total = await ctx.qb.getCount();

    return {
      total,
      data: entities.map((lot, index) =>
        this.toResponseDto(
          lot,
          this.relevanceService.computeLevel(rawRows[index], plan),
        ),
      ),
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
    const { qb, user, filters, isAdmin, wantsSelfOnly } = ctx;

    if (!user) {
      qb.andWhere('lot.visibilityStatus = :active', {
        active: LotVisibilityStatus.ACTIVE,
      });
      return;
    }

    if (wantsSelfOnly) {
      qb.andWhere('lot.userId = :userId', { userId: user.sub });

      // Константный фильтр для модалки обмена: предлагать можно только
      // не-деактивированные лоты (ACTIVE/HIDDEN), архивные исключаем.
      if (filters?.excludeArchived) {
        qb.andWhere('lot.visibilityStatus != :archived', {
          archived: LotVisibilityStatus.ARCHIVED,
        });
      }
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

  private applyPagination(ctx: LotQueryContext, page: number, limit: number) {
    ctx.qb.skip((page - 1) * limit).take(limit);
  }

  private toResponseDto(
    lot: LotEntity,
    relevanceLevel?: number,
  ): LotResponseDto {
    const geo = this.geographyService.build({
      regionId: lot.regionId,
      cityId: lot.cityId,
      districtId: lot.districtId ?? null,
    });

    return {
      id: lot.id,
      userId: lot.userId,
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
      relevanceLevel,
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

    // Модерация: админ сменил статус ЧУЖОГО лота на неактивный → владельцу.
    if (
      isAdmin &&
      savedLot.userId !== user.sub &&
      savedLot.visibilityStatus !== previousStatus &&
      savedLot.visibilityStatus !== LotVisibilityStatus.ACTIVE
    ) {
      this.notificationsService.emit(
        notificationBuilders.lotModerated({
          userId: savedLot.userId,
          lotId: savedLot.id,
          lotTitle: savedLot.generalDescription,
          status: savedLot.visibilityStatus,
        }),
      );
    }

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

    const ownerId = lot.userId;
    const lotTitle = lot.generalDescription;
    const removedLotId = lot.id;

    await this.lotsRepo.remove(lot);
    await this.lotArchiveService.remove(removedLotId);

    // Админ удалил ЧУЖОЙ лот → уведомляем владельца.
    if (ownerId !== user.sub) {
      this.notificationsService.emit(
        notificationBuilders.lotRemoved({
          userId: ownerId,
          lotId: removedLotId,
          lotTitle,
        }),
      );
    }

    return { success: true };
  }
}
