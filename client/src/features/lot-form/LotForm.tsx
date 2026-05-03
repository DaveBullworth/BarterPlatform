import { useState } from 'react';
import { Stack, Group, Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { UseFormReturnType } from '@mantine/form';

import { ConfirmModal } from '@/shared/ui';
import { LotStatusActions } from '@/features/lot-status';
import { useNavigation } from '@/shared/lib/navigation';
import { TaxonomySection } from './sections/TaxonomySection';
import { GeoSection } from './sections/GeoSection';
import { ImagesSection } from './sections/ImagesSection';
import { BasicInfoSection } from './sections/BasicInfoSection';
import type { LotFormValues } from './model';
import type { RenderedImage } from './useLotImages';
import type { Lot } from '@/entities/lot';
import type { GeoValue } from '@/shared/ui';
import type { Category } from '@/entities/taxonomy';

type Props = {
  // Form state
  form: UseFormReturnType<LotFormValues>;
  onSubmit: () => void;
  isFormDirty: boolean;

  // Taxonomy
  onTaxonomyPick: (
    chapterId: number,
    category: Category,
    subcategoryId: number | null,
  ) => void;

  // Geo
  geoDisplayPath: string;
  onGeoChange: (value: GeoValue) => void;

  // Images
  images: RenderedImage[];
  imagesTotalCount: number;
  maxImages: number;
  onImagesAdd: (files: File[]) => void;
  onImageRemoveExisting: (id: string) => void;
  onImageRemoveNew: (id: string) => void;
  onImageSetPrimaryExisting: (id: string) => void;
  onImageSetPrimaryNew: (id: string) => void;

  // Status
  isArchived: boolean;
  isEditMode: boolean;
  lot?: Lot | null;

  // Loading
  loading: boolean;
};

export const LotForm = ({
  form,
  onSubmit,
  isFormDirty,
  onTaxonomyPick,
  geoDisplayPath,
  onGeoChange,
  images,
  imagesTotalCount,
  maxImages,
  onImagesAdd,
  onImageRemoveExisting,
  onImageRemoveNew,
  onImageSetPrimaryExisting,
  onImageSetPrimaryNew,
  isArchived,
  isEditMode,
  lot,
  loading,
}: Props) => {
  const { t } = useTranslation();
  const { back } = useNavigation();
  const [confirmOpened, setConfirmOpened] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormDirty) return;
    setConfirmOpened(true);
  };

  // В LotForm.tsx — локальный хелпер
  const getError = (...fields: string[]): string | undefined => {
    for (const field of fields) {
      const err = form.errors[field];
      if (err) return String(err);
    }
    return undefined;
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TaxonomySection
            value={form.values.taxonomyPath}
            error={form.errors.taxonomyPath as string}
            selected={{
              chapterId: form.values.chapterId,
              categoryId: form.values.categoryId,
              subcategoryId: form.values.subcategoryId,
            }}
            onPick={onTaxonomyPick}
          />

          <GeoSection
            value={{
              regionId: form.values.regionId,
              cityId: form.values.cityId,
              districtId: form.values.districtId,
            }}
            displayPath={geoDisplayPath}
            error={getError('regionId', 'cityId')}
            onChange={onGeoChange}
          />

          <ImagesSection
            images={images}
            totalCount={imagesTotalCount}
            maxImages={maxImages}
            onAdd={onImagesAdd}
            onRemoveExisting={onImageRemoveExisting}
            onRemoveNew={onImageRemoveNew}
            onSetPrimaryExisting={onImageSetPrimaryExisting}
            onSetPrimaryNew={onImageSetPrimaryNew}
          />

          <BasicInfoSection
            values={form.values}
            isArchived={isArchived}
            getInputProps={form.getInputProps}
            setFieldValue={form.setFieldValue}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={back}>
              {t('lotForm.actions.cancel')}
            </Button>

            {isEditMode && lot && (
              <LotStatusActions lot={lot} disabled={isFormDirty} />
            )}

            <Button type="submit" loading={loading} disabled={!isFormDirty}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </form>

      <ConfirmModal
        opened={confirmOpened}
        onCancel={() => setConfirmOpened(false)}
        onConfirm={() => {
          setConfirmOpened(false);
          onSubmit();
        }}
        title={t('lotForm.confirm.saveTitle')}
        message={t('lotForm.confirm.saveMessage')}
        confirmLabel={t('common.save')}
        cancelLabel={t('lotForm.actions.cancel')}
        confirmColor="blue"
        loading={loading}
      />
    </>
  );
};
