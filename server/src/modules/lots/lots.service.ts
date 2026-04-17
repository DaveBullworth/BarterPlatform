import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { LotEntity, LotVisibilityStatus } from '@/database/entities/lot.entity';
import { UserRole } from '@/database/entities/user.entity';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import type {
  CategorySeed,
  ChapterSeed,
  SubcategorySeed,
} from './types/taxonomy.types';
import { LotErrorCode } from './errors/lots-error-codes';
import { RedisService } from '@/common/services/redis/redis.service';
import { UserErrorCode } from '../users/errors/users-error-codes';
import { LotFiltersDto } from './dto/lotFilters.dto';
import { LotResponseDto } from './dto/getAllLots.dto';
import { loadSeed } from '@/common/utils/load-seed.util';
import { applyTextFilter as applyTextFilterImported } from '@/common/utils/query-filters.util';
import { GeographyNodeDto } from '@/common/dtos/geo-node.dto';
import { LotOneResponseDto } from './dto/getOneLot.dto';
import type { Region, City, District } from '@/common/types/geo.type';

const chapters = loadSeed<ChapterSeed>('src/database/seeds/chapter.json');
const categories = loadSeed<CategorySeed>('src/database/seeds/category.json');
const subcategories = loadSeed<SubcategorySeed>(
  'src/database/seeds/subcategory.json',
);

const regions = loadSeed<Region>('src/database/seeds/geography_region.json');
const cities = loadSeed<City>('src/database/seeds/geography_city.json');
const districts = loadSeed<District>(
  'src/database/seeds/geography_district.json',
);

@Injectable()
export class LotsService implements OnModuleInit, OnModuleDestroy {
  private static readonly ARCHIVE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  private static readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(LotEntity)
    private readonly lotsRepo: Repository<LotEntity>,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    this.cleanupArchivedLots().catch(() => undefined);
    this.cleanupTimer = setInterval(() => {
      this.cleanupArchivedLots().catch(() => undefined);
    }, LotsService.CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private applyLotIdFilter(
    qb: SelectQueryBuilder<LotEntity>,
    field:
      | 'chapterId'
      | 'categoryId'
      | 'subcategoryId'
      | 'regionId'
      | 'cityId'
      | 'districtId',
    value: string,
  ) {
    const id = Number(value);
    if (!Number.isFinite(id)) return;

    qb.andWhere(`lot.${field} = :${field}`, {
      [field]: id,
    });
  }

  private applyTextFilter = applyTextFilterImported<LotEntity>;

  private buildGeography(lot: LotEntity) {
    const region = regions.find((r) => r.externalId === lot.regionId);
    const city = cities.find((c) => c.externalId === lot.cityId);
    const district = districts.find((d) => d.externalId === lot.districtId);

    const asNode = <T extends { externalId: number; name: string }>(
      item?: T,
    ): GeographyNodeDto | null => {
      if (!item) return null;
      return { id: item.externalId, name: item.name };
    };

    return {
      region: asNode(region),
      city: asNode(city),
      district: asNode(district),
    };
  }

  private validateGeography(
    regionId: number,
    cityId: number,
    districtId?: number | null,
  ) {
    const region = regions.find((r) => r.externalId === regionId);
    if (!region) {
      throw new NotFoundException({
        code: UserErrorCode.REGION_NOT_FOUND,
        message: 'Region not found',
      });
    }

    const city = cities.find((c) => c.externalId === cityId);
    if (!city || city.regionId !== regionId) {
      throw new NotFoundException({
        code: UserErrorCode.CITY_NOT_FOUND,
        message: 'City not found for selected region',
      });
    }

    if (districtId == null) {
      return;
    }

    const district = districts.find((d) => d.externalId === districtId);
    if (!district || district.cityId !== cityId) {
      throw new NotFoundException({
        code: UserErrorCode.DISTRICT_NOT_FOUND,
        message: 'District not found for selected city',
      });
    }
  }

  private async syncArchiveTracking(
    lotId: string,
    previousStatus: LotVisibilityStatus,
    nextStatus: LotVisibilityStatus,
  ): Promise<Date | null> {
    if (
      previousStatus !== LotVisibilityStatus.ARCHIVED &&
      nextStatus === LotVisibilityStatus.ARCHIVED
    ) {
      return await this.redisService.markLotArchived(lotId);
    }

    if (
      previousStatus === LotVisibilityStatus.ARCHIVED &&
      nextStatus !== LotVisibilityStatus.ARCHIVED
    ) {
      await this.redisService.unmarkLotArchived(lotId);
    }

    return null;
  }

  private async cleanupArchivedLots() {
    const threshold = new Date(Date.now() - LotsService.ARCHIVE_TTL_MS);
    const lotIds =
      await this.redisService.getArchivedLotIdsDueForDeletion(threshold);

    if (!lotIds.length) return;

    await this.lotsRepo
      .createQueryBuilder()
      .delete()
      .from(LotEntity)
      .where('id IN (:...ids)', { ids: lotIds })
      .andWhere('visibilityStatus = :status', {
        status: LotVisibilityStatus.ARCHIVED,
      })
      .execute();

    await this.redisService.unmarkArchivedLots(lotIds);
  }

  getTaxonomy() {
    return chapters.map((chapter) => ({
      id: chapter.externalId,
      name: chapter.name,
      slug: chapter.slug,
      categories: categories
        .filter((category) => category.chapterId === chapter.externalId)
        .map((category) => ({
          id: category.externalId,
          name: category.name,
          slug: category.slug,
          subcategories: subcategories
            .filter(
              (subcategory) => subcategory.categoryId === category.externalId,
            )
            .map((subcategory) => ({
              id: subcategory.externalId,
              name: subcategory.name,
              slug: subcategory.slug,
            })),
        })),
    }));
  }

  private validateTaxonomy(
    chapterId: number,
    categoryId: number,
    subcategoryId?: number,
  ) {
    const chapter = chapters.find((item) => item.externalId === chapterId);
    if (!chapter)
      throw new NotFoundException({
        code: LotErrorCode.CHAPTER_NOT_FOUND,
        message: 'Chapter not found',
      });

    const category = categories.find((item) => item.externalId === categoryId);
    if (!category || category.chapterId !== chapterId) {
      throw new NotFoundException({
        code: LotErrorCode.CATEGORY_NOT_FOUND,
        message: 'Category not found in chapter',
      });
    }

    // Проверяем, есть ли у категории подкатегории
    const categorySubcategories = subcategories.filter(
      (item) => item.categoryId === categoryId,
    );

    if (categorySubcategories.length > 0) {
      // Если подкатегории есть, subcategoryId обязателен
      if (subcategoryId == null) {
        throw new ConflictException({
          code: LotErrorCode.SUBCATEGORY_REQUIRED,
          message: 'Subcategory must be selected for this category',
        });
      }

      const subcategory = subcategories.find(
        (item) => item.externalId === subcategoryId,
      );
      if (!subcategory || subcategory.categoryId !== categoryId) {
        throw new NotFoundException({
          code: LotErrorCode.SUBCATEGORY_NOT_FOUND,
          message: 'Subcategory not found in category',
        });
      }
    }
  }

  async create(dto: CreateLotDto, user: JwtPayload) {
    this.validateTaxonomy(dto.chapterId, dto.categoryId, dto.subcategoryId);

    this.validateGeography(dto.regionId, dto.cityId, dto.districtId ?? null);

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

    return createdLot;
  }

  async getAll(params: {
    page: number;
    limit: number;
    filters?: LotFiltersDto;
    user: JwtPayload;
  }): Promise<{ data: LotResponseDto[]; total: number }> {
    const { page, limit, filters, user } = params;

    const qb = this.lotsRepo.createQueryBuilder('lot');

    // БАЗОВАЯ ЛОГИКА ДОСТУПА
    if (user.role !== UserRole.ADMIN) {
      qb.andWhere('(lot.visibilityStatus = :active OR lot.userId = :userId)', {
        active: LotVisibilityStatus.ACTIVE,
        userId: user.sub,
      });
    }

    // ID ФИЛЬТРЫ (строго equals)
    const idFiltersMap = [
      'chapterId',
      'categoryId',
      'subcategoryId',
      'regionId',
      'cityId',
      'districtId',
    ] as const;

    for (const field of idFiltersMap) {
      const filter = filters?.[field];
      if (filter) {
        this.applyLotIdFilter(qb, field, filter.value);
      }
    }

    // TEXT FILTER
    if (filters?.query) {
      this.applyTextFilter(
        qb,
        'lot.generalDescription',
        filters.query,
        'query',
      );

      // если хочешь искать и в характеристиках — лучше сразу так:
      qb.orWhere('lot.characteristicsDescription ILIKE :query', {
        query: `%${filters.query.value}%`,
      });
    }

    // СОРТИРОВКА (всегда одна)
    qb.orderBy('lot.createdAt', 'DESC');

    // ПАГИНАЦИЯ
    qb.skip((page - 1) * limit).take(limit);

    const [lots, total] = await qb.getManyAndCount();

    return {
      total,
      data: lots.map((lot) => this.toResponseDto(lot)),
    };
  }

  private toResponseDto(lot: LotEntity): LotResponseDto {
    const geo = this.buildGeography(lot);

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

  async getOne(id: string, user: JwtPayload): Promise<LotOneResponseDto> {
    const lot = await this.lotsRepo.findOne({ where: { id } });
    if (!lot)
      throw new NotFoundException({
        code: LotErrorCode.LOT_NOT_FOND,
        message: 'Lot not found',
      });

    if (
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
      archivationDate = await this.redisService.getLotArchivationDate(lot.id);
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

      if (lot.visibilityStatus === LotVisibilityStatus.ARCHIVED) {
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

    this.validateTaxonomy(chapterId, categoryId, subcategoryId);

    if (nextRegionId && nextCityId) {
      this.validateGeography(nextRegionId, nextCityId, nextDistrictId ?? null);
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
    let archivationDate = await this.syncArchiveTracking(
      savedLot.id,
      previousStatus,
      savedLot.visibilityStatus,
    );

    if (
      previousStatus === LotVisibilityStatus.ARCHIVED &&
      savedLot.visibilityStatus === LotVisibilityStatus.ARCHIVED
    ) {
      archivationDate = await this.redisService.getLotArchivationDate(
        savedLot.id,
      );
    }

    const geo = this.buildGeography(lot);

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
    await this.redisService.unmarkLotArchived(lot.id);

    return { success: true };
  }
}
