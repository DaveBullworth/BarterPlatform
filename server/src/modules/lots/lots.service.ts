import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Repository } from 'typeorm';
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

function loadSeed<T>(filename: string): T[] {
  return JSON.parse(readFileSync(join(process.cwd(), filename), 'utf8')) as T[];
}

const chapters = loadSeed<ChapterSeed>('src/database/seeds/chapter.json');
const categories = loadSeed<CategorySeed>('src/database/seeds/category.json');
const subcategories = loadSeed<SubcategorySeed>(
  'src/database/seeds/subcategory.json',
);

export type LotWithArchivationDate = LotEntity & {
  archivationDate?: string | null;
};

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

    const lot = this.lotsRepo.create({
      userId: user.sub,
      chapterId: dto.chapterId,
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId ?? null,
      generalDescription: dto.generalDescription,
      characteristicsDescription: dto.characteristicsDescription,
      quantity: dto.quantity,
      visibilityStatus: dto.visibilityStatus,
    });

    const createdLot = await this.lotsRepo.save(lot);

    return createdLot;
  }

  async getAll(user: JwtPayload) {
    if (user.role === UserRole.ADMIN) {
      return this.lotsRepo.find({ order: { createdAt: 'DESC' } });
    }

    return this.lotsRepo
      .createQueryBuilder('lot')
      .where('lot.visibilityStatus = :active', {
        active: LotVisibilityStatus.ACTIVE,
      })
      .orWhere('lot.userId = :userId', { userId: user.sub })
      .orderBy('lot.createdAt', 'DESC')
      .getMany();
  }

  async getOne(id: string, user: JwtPayload): Promise<LotWithArchivationDate> {
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

    if (lot.visibilityStatus === LotVisibilityStatus.ARCHIVED) {
      const archivationDate = await this.redisService.getLotArchivationDate(
        lot.id,
      );

      return {
        ...lot,
        archivationDate: archivationDate ? archivationDate.toISOString() : null,
      };
    }

    return lot;
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
    this.validateTaxonomy(chapterId, categoryId, subcategoryId);

    Object.assign(lot, {
      chapterId,
      categoryId,
      subcategoryId: dto.subcategoryId ?? lot.subcategoryId,
      generalDescription: dto.generalDescription ?? lot.generalDescription,
      characteristicsDescription:
        dto.characteristicsDescription ?? lot.characteristicsDescription,
      quantity: dto.quantity ?? lot.quantity,
      visibilityStatus: dto.visibilityStatus ?? lot.visibilityStatus,
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

    return {
      ...savedLot,
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
