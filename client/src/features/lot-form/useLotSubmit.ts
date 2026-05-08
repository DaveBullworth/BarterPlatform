import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { lotKeys, lotApi, LOT_STATUS, type Lot } from '@/entities/lot';
import { notify, handleApiError } from '@/shared/lib';
import type { LotFormValues } from './model';
import type { NewImage } from './useLotImages';

type UseLotSubmitOptions = {
  lotId?: string;
  deletedImageIds: string[];
  pendingPrimaryId: string | null;
  newImages: NewImage[];
  onSuccess: (lot: Lot) => void;
};

export const useLotSubmit = ({
  lotId,
  deletedImageIds,
  pendingPrimaryId,
  newImages,
  onSuccess,
}: UseLotSubmitOptions) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(lotId);

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: LotFormValues): Promise<Lot> => {
      if (!values.chapterId || !values.categoryId) {
        throw new Error('Taxonomy not selected');
      }

      const dto = {
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
          ? LOT_STATUS.ACTIVE
          : LOT_STATUS.HIDDEN,
      };

      // 1. Создаём/обновляем лот
      const lot = isEditMode
        ? await lotApi.update(lotId!, dto)
        : await lotApi.create(dto);

      // 2. Удаляем помеченные изображения
      for (const imageId of deletedImageIds) {
        await lotApi.deleteImage(imageId);
      }

      // 3. Загружаем новые
      let nextPrimaryId = pendingPrimaryId;
      for (const image of newImages) {
        const result = await lotApi.uploadImage(lot.id, image.file);
        if (image.isPrimary) nextPrimaryId = result.imageId;
      }

      // 4. Устанавливаем главное
      if (nextPrimaryId) {
        await lotApi.setPrimaryImage(lot.id, nextPrimaryId);
      }

      return lot;
    },
    onSuccess: (lot) => {
      queryClient.setQueryData(lotKeys.detail(lot.id), lot);
      queryClient.invalidateQueries({ queryKey: lotKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lotKeys.images(lot.id) });
      queryClient.invalidateQueries({ queryKey: lotKeys.mainImagesAll() });

      notify({
        title: t('common.success'),
        message: isEditMode
          ? t('lotForm.success.updated')
          : t('lotForm.success.created'),
        color: 'green',
      });

      onSuccess(lot);
    },
    onError: (error) => handleApiError(error, t),
  });

  return {
    submit: mutate,
    isPending,
  };
};
