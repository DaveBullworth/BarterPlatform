import { useLot, useLotImages } from '@/entities/lot';
import { useTaxonomy, resolveTaxonomyPath } from '@/entities/taxonomy';
import { LOT_STATUS } from '@/entities/lot';
import type { LotFormValues } from './model';

export const useLotFormData = (lotId: string | undefined) => {
  const {
    data: lot,
    isLoading: isLotLoading,
    isError,
    error,
    refetch,
  } = useLot(lotId);
  const { data: images = [], isLoading: isImagesLoading } = useLotImages(lotId);
  const { data: taxonomy = [] } = useTaxonomy();

  const isLoading = isLotLoading || isImagesLoading;

  // Вычисляем начальные значения формы из загруженного лота
  const initialValues: LotFormValues | null = lot
    ? {
        taxonomyPath: resolveTaxonomyPath(taxonomy, {
          chapterId: lot.chapterId,
          categoryId: lot.categoryId,
          subcategoryId: lot.subcategoryId ?? null,
        }),
        chapterId: lot.chapterId,
        categoryId: lot.categoryId,
        subcategoryId: lot.subcategoryId ?? null,
        generalDescription: lot.generalDescription,
        characteristicsDescription: lot.characteristicsDescription,
        quantity: lot.quantity,
        regionId: lot.region ? String(lot.region.id) : '',
        cityId: lot.city ? String(lot.city.id) : '',
        districtId: lot.district ? String(lot.district.id) : '',
        visibilityStatus: lot.visibilityStatus === LOT_STATUS.ACTIVE,
        archivationDate: lot.archivationDate ?? null,
      }
    : null;

  const isArchived = lot?.visibilityStatus === LOT_STATUS.ARCHIVED;

  return {
    lot,
    images,
    initialValues,
    isArchived,
    isLoading,
    isError,
    error,
    refetch,
  };
};
