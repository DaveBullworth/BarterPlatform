import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { LotErrorCode } from './errors/lots-error-codes';
import {
  CategorySeed,
  ChapterSeed,
  SubcategorySeed,
} from './types/taxonomy.types';
import { loadSeed } from '@/common/utils/load-seed.util';
import { TaxonomyTargetType } from '@/database/entities/user-taxonomy-preference.entity';

const chapters = loadSeed<ChapterSeed>('src/database/seeds/chapter.json');
const categories = loadSeed<CategorySeed>('src/database/seeds/category.json');
const subcategories = loadSeed<SubcategorySeed>(
  'src/database/seeds/subcategory.json',
);

@Injectable()
export class TaxonomyService {
  getTree() {
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

  validate(chapterId: number, categoryId: number, subcategoryId?: number) {
    const chapter = chapters.find((item) => item.externalId === chapterId);
    if (!chapter) {
      throw new NotFoundException({
        code: LotErrorCode.CHAPTER_NOT_FOUND,
        message: 'Chapter not found',
      });
    }

    const category = categories.find((item) => item.externalId === categoryId);
    if (!category || category.chapterId !== chapterId) {
      throw new NotFoundException({
        code: LotErrorCode.CATEGORY_NOT_FOUND,
        message: 'Category not found in chapter',
      });
    }

    const categorySubcategories = subcategories.filter(
      (item) => item.categoryId === categoryId,
    );

    if (categorySubcategories.length > 0) {
      if (subcategoryId == null) {
        throw new ConflictException({
          code: LotErrorCode.SUBCATEGORY_REQUIRED,
          message: 'Subcategory must be selected for this category',
        });
      }

      const subcategory = subcategories.find(
        (item) =>
          item.externalId === subcategoryId && item.categoryId === categoryId,
      );

      if (!subcategory) {
        throw new NotFoundException({
          code: LotErrorCode.SUBCATEGORY_NOT_FOUND,
          message: 'Subcategory not found in category',
        });
      }
    }
  }

  /** Проверяет существование одиночного targetType+targetId (для предпочтений). */
  targetExists(targetType: TaxonomyTargetType, targetId: number): boolean {
    switch (targetType) {
      case TaxonomyTargetType.CHAPTER:
        return chapters.some((c) => c.externalId === targetId);
      case TaxonomyTargetType.CATEGORY:
        return categories.some((c) => c.externalId === targetId);
      case TaxonomyTargetType.SUBCATEGORY:
        return subcategories.some((s) => s.externalId === targetId);
      default:
        return false;
    }
  }

  /** Плоский список всех узлов таксономии — нужен для "Выбрать все". */
  listAllTargets(): Array<{
    targetType: TaxonomyTargetType;
    targetId: number;
  }> {
    return [
      ...chapters.map((c) => ({
        targetType: TaxonomyTargetType.CHAPTER,
        targetId: c.externalId,
      })),
      ...categories.map((c) => ({
        targetType: TaxonomyTargetType.CATEGORY,
        targetId: c.externalId,
      })),
      ...subcategories.map((s) => ({
        targetType: TaxonomyTargetType.SUBCATEGORY,
        targetId: s.externalId,
      })),
    ];
  }
}
