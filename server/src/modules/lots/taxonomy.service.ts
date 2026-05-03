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
}
