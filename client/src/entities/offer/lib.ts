import type { PreferenceAvailability } from './model';

type LotTaxonomy = {
  chapterId: number;
  categoryId: number;
  subcategoryId?: number | null;
};

/**
 * Лот можно предложить в обмен, если он попадает в предпочтения получателя на
 * любом уровне таксономии (матрёшка раздел→категория→подкатегория обеспечивается
 * тем, что лот несёт весь свой путь id).
 */
export const isLotOfferable = (
  lot: LotTaxonomy,
  availability: PreferenceAvailability | undefined,
): boolean => {
  if (!availability) return false;
  if (availability.chapterIds.includes(lot.chapterId)) return true;
  if (availability.categoryIds.includes(lot.categoryId)) return true;
  if (
    lot.subcategoryId != null &&
    availability.subcategoryIds.includes(lot.subcategoryId)
  ) {
    return true;
  }
  return false;
};
