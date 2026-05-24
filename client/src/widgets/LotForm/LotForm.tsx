import { useState } from 'react';
import { ActionIcon, Button, Group, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ArrowLeft, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UseFormReturnType } from '@mantine/form';

import { ConfirmModal } from '@/shared/ui';
import { LotStatusActions } from '@/features/lot-status';
import { useNavigation } from '@/shared/lib/navigation';
import { TaxonomySection } from '@/entities/taxonomy';
import { GeoSection } from './sections/GeoSection';
import { ImagesSection } from './sections/ImagesSection';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { FormSection } from './FormSection';
import type { LotFormValues, RenderedImage } from '@/features/lot-form';
import type { Lot } from '@/entities/lot';
import type { GeoValue } from '@/entities/geography';
import type { Category } from '@/entities/taxonomy';

import styles from './LotForm.module.scss';

type Props = {
  form: UseFormReturnType<LotFormValues>;
  onSubmit: () => void;
  isFormDirty: boolean;

  onTaxonomyPick: (
    chapterId: number,
    category: Category,
    subcategoryId: number | null,
  ) => void;

  geoDisplayPath: string;
  onGeoChange: (value: GeoValue) => void;

  images: RenderedImage[];
  imagesTotalCount: number;
  maxImages: number;
  onImagesAdd: (files: File[]) => void;
  onImageRemoveExisting: (id: string) => void;
  onImageRemoveNew: (id: string) => void;
  onImageSetPrimaryExisting: (id: string) => void;
  onImageSetPrimaryNew: (id: string) => void;

  isArchived: boolean;
  isEditMode: boolean;
  lot?: Lot | null;

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
  const isMobile = useMediaQuery('(max-width: 48em)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormDirty) return;
    setConfirmOpened(true);
  };

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
        <div className={styles.formGrid}>
          <FormSection step={1} title={t('lotForm.taxonomy.title')}>
            <TaxonomySection
              value={form.values.taxonomyPath}
              error={form.errors.taxonomyPath as string}
              selected={{
                chapterId: form.values.chapterId,
                categoryId: form.values.categoryId,
                subcategoryId: form.values.subcategoryId,
              }}
              onPick={onTaxonomyPick}
              classes={{
                summary: styles.summary,
                summaryFilled: styles.summaryFilled,
                summaryIcon: styles.summaryIcon,
                summaryBody: styles.summaryBody,
                summaryPlaceholder: styles.summaryPlaceholder,
                summaryPath: styles.summaryPath,
                summaryError: styles.summaryError,
                summaryAction: styles.summaryAction,
              }}
            />
          </FormSection>

          <FormSection step={2} title={t('lotForm.geo.title')}>
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
          </FormSection>

          <FormSection
            step={3}
            title={t('lotForm.images.title')}
            hint={`${imagesTotalCount}/${maxImages}`}
          >
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
          </FormSection>

          <FormSection step={4} title={t('lotForm.fields.title')}>
            <BasicInfoSection
              values={form.values}
              isArchived={isArchived}
              getInputProps={form.getInputProps}
              setFieldValue={form.setFieldValue}
            />
          </FormSection>

          {/* Sticky footer с actions
             На мобиле: Cancel → круглый ActionIcon, status-actions → overflow menu,
             Save → растягивается на оставшуюся ширину. На десктопе всё кнопками. */}
          <div className={styles.footer}>
            <div className={styles.footerLeft}>
              {isMobile ? (
                <Tooltip
                  label={t('lotForm.actions.cancel')}
                  withArrow
                  position="top"
                >
                  <ActionIcon
                    variant="default"
                    size="lg"
                    radius="md"
                    onClick={back}
                    aria-label={t('lotForm.actions.cancel')}
                  >
                    <ArrowLeft size={18} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <Button
                  variant="default"
                  leftSection={<ArrowLeft size={16} />}
                  onClick={back}
                >
                  {t('lotForm.actions.cancel')}
                </Button>
              )}
            </div>

            <div className={styles.footerRight}>
              {isEditMode && lot && (
                <LotStatusActions
                  lot={lot}
                  disabled={isFormDirty}
                  mode={isMobile ? 'menu' : 'buttons'}
                />
              )}

              <Button
                type="submit"
                className={styles.footerSave}
                leftSection={<Save size={16} />}
                loading={loading}
                disabled={!isFormDirty}
              >
                {t('common.save')}
              </Button>
            </div>
          </div>

          {/* Чтобы sticky footer не наезжал на скроллбары — small bottom gap */}
          <Group h={4} />
        </div>
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
        confirmColor="barter"
        loading={loading}
      />
    </>
  );
};
