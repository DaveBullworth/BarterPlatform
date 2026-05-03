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

@Injectable()
export class LotsService {
  constructor(
    @InjectRepository(LotEntity)
    private readonly lotsRepo: Repository<LotEntity>,
    private readonly lotArchiveService: LotArchiveService,
    private readonly geographyService: GeographyService,
    private readonly taxonomyService: TaxonomyService,
  ) {}

  private applyTextFilter = applyTextFilterImported<LotEntity>;

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

    return createdLot;
  }

  async getAll(params: {
    page: number;
    limit: number;
    filters?: LotFiltersDto;
    user?: JwtPayload;
  }): Promise<{ data: LotResponseDto[]; total: number }> {
    const { page, limit, filters, user } = params;

    const qb = this.lotsRepo.createQueryBuilder('lot');

    // БАЗОВАЯ ЛОГИКА ДОСТУПА
    if (!user) {
      qb.andWhere('lot.visibilityStatus = :active', {
        active: LotVisibilityStatus.ACTIVE,
      });
    } else if (user.role !== UserRole.ADMIN) {
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
