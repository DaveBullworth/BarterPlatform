import {
  ForbiddenException,
  Injectable,
  NotFoundException,
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

function loadSeed<T>(filename: string): T[] {
  return JSON.parse(readFileSync(join(process.cwd(), filename), 'utf8')) as T[];
}

const chapters = loadSeed<ChapterSeed>('src/database/seeds/chapter.json');
const categories = loadSeed<CategorySeed>('src/database/seeds/category.json');
const subcategories = loadSeed<SubcategorySeed>(
  'src/database/seeds/subcategory.json',
);

@Injectable()
export class LotsService {
  constructor(
    @InjectRepository(LotEntity)
    private readonly lotsRepo: Repository<LotEntity>,
  ) {}

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

    if (subcategoryId == null) return;

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

  async create(dto: CreateLotDto, user: JwtPayload) {
    this.validateTaxonomy(dto.chapterId, dto.categoryId, dto.subcategoryId);

    const lot = this.lotsRepo.create({
      userId: user.sub,
      chapterId: dto.chapterId,
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId ?? null,
      generalDescription: dto.generalDescription,
      characteristicsDescription: dto.characteristicsDescription,
      quantity: dto.quantity ?? 1,
      visibilityStatus: dto.visibilityStatus ?? LotVisibilityStatus.HIDDEN,
    });

    return this.lotsRepo.save(lot);
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

  async getOne(id: string, user: JwtPayload) {
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

    return this.lotsRepo.save(lot);
  }

  async remove(id: string, user: JwtPayload) {
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
          message: 'Only owner can delete lot',
        });
      }

      if (lot.visibilityStatus === LotVisibilityStatus.ARCHIVED) {
        throw new ForbiddenException({
          code: LotErrorCode.USER_ARCHIVED,
          message: 'Archived lots cannot be deleted by user',
        });
      }
    }

    await this.lotsRepo.remove(lot);

    return { success: true };
  }
}
