import { LOT_VISIBILITY_STATUS, type CreateLotDto } from '@/types/lot';
import { createLot, updateLot } from '@/http/lots';
import {
  deleteLotImage,
  setPrimaryLotImage,
  uploadLotImage,
} from '@/http/media';
import { notify } from '@/shared/utils/notifications';
import { handleApiError } from '@/shared/utils/handleApiError';
import type { TFunction } from 'i18next';
import type { FormValues } from './useLotForm';

// Утилитный тип, который убирает null из типа обязательных свойств
type NonNullableProps<T> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};

export type ValidatedFormValues = NonNullableProps<FormValues>;

export const useLotSubmit = ({
  t,
  isEditMode,
  id,
  pendingDeleteImageIds,
  pendingPrimaryImageId,
  newImages,
  resetImages,
  resetDirty,
  setLoading,
  setShouldNavigate,
}: {
  t: TFunction;
  isEditMode: boolean;
  id?: string;
  pendingDeleteImageIds: string[];
  pendingPrimaryImageId: string | null;
  newImages: { file: File; isPrimary: boolean }[];
  resetImages: () => void;
  resetDirty: () => void;
  setLoading: (val: boolean) => void;
  setShouldNavigate: (val: string) => void;
}) => {
  const isValidForSubmit = (
    values: FormValues,
  ): values is ValidatedFormValues => {
    return (
      !!values.chapterId &&
      !!values.categoryId &&
      !!values.regionId &&
      !!values.cityId
    );
  };

  const submitLot = async (values: ValidatedFormValues) => {
    setLoading(true);

    try {
      const dto: CreateLotDto = {
        chapterId: values.chapterId,
        categoryId: values.categoryId,
        subcategoryId: values.subcategoryId ?? undefined,
        generalDescription: values.generalDescription,
        characteristicsDescription: values.characteristicsDescription,
        quantity: values.quantity,
        regionId: Number(values.regionId),
        cityId: Number(values.cityId),
        districtId: values.districtId ? Number(values.districtId) : null,
        visibilityStatus: values.visibilityStatus
          ? LOT_VISIBILITY_STATUS.ACTIVE
          : LOT_VISIBILITY_STATUS.HIDDEN,
      };

      const lot =
        isEditMode && id ? await updateLot(id, dto) : await createLot(dto);

      const lotId = lot.id;

      // --- delete images
      for (const imageId of pendingDeleteImageIds) {
        await deleteLotImage(imageId);
      }

      // --- upload images
      let nextPrimaryImageId = pendingPrimaryImageId;

      for (const image of newImages) {
        const uploaded = await uploadLotImage(lotId, image.file);

        if (image.isPrimary) {
          nextPrimaryImageId = uploaded.imageId;
        }
      }

      // --- set primary
      if (nextPrimaryImageId) {
        await setPrimaryLotImage(lotId, nextPrimaryImageId);
      }

      notify({
        title: t('common.success'),
        message: isEditMode
          ? t('lotForm.success.updated')
          : t('lotForm.success.created'),
        color: 'green',
      });

      resetImages();
      resetDirty();
      setShouldNavigate(lotId);
    } catch (error) {
      handleApiError(error, t);
    } finally {
      setLoading(false);
    }
  };

  return {
    isValidForSubmit,
    submitLot,
  };
};
