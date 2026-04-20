import ConfirmModal from '@/shared/ui/ConfirmModal';
import { useState } from 'react';
import { Stack, Group, Button } from '@mantine/core';
import { TaxonomySection, type TaxonomySectionProps } from './TaxonomySection';
import { GeoSection, type GeoSectionProps } from './GeoSection';
import { ImagesSection, type ImagesSectionProps } from './ImagesSection';
import {
  BasicInfoSection,
  type BasicInfoSectionProps,
} from './BasicInfoSection';
import type { TFunction } from 'i18next';

type Props = {
  onSubmit: () => void;

  taxonomy: Omit<TaxonomySectionProps, 't'>;

  geo: Omit<GeoSectionProps, 't'>;

  images: Omit<ImagesSectionProps, 't'>;

  basicInfo: Omit<BasicInfoSectionProps, 't'>;

  actions: {
    isFormDirty: boolean;
    loading: boolean;
    showDeactivate: boolean;
    showUnarchive: boolean;

    onCancel: () => void;
    onDeactivate: () => void;
    onUnarchive: () => void;
  };

  t: TFunction;
};

export const LotForm = ({
  onSubmit,
  taxonomy,
  geo,
  images,
  basicInfo,
  actions,
  t,
}: Props) => {
  const [confirmOpened, setConfirmOpened] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!actions.isFormDirty) return;

    setConfirmOpened(true);
  };

  const handleConfirm = () => {
    setConfirmOpened(false);
    onSubmit();
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TaxonomySection {...taxonomy} t={t} />

          <GeoSection {...geo} t={t} />

          <ImagesSection {...images} t={t} />

          <BasicInfoSection {...basicInfo} t={t} />

          <Group justify="flex-end">
            <Button variant="default" onClick={actions.onCancel}>
              {t('lotForm.actions.cancel')}
            </Button>

            {actions.showDeactivate && (
              <Button
                disabled={actions.isFormDirty}
                color="red"
                variant="light"
                loading={actions.loading}
                onClick={actions.onDeactivate}
              >
                {t('lotForm.actions.deactivate')}
              </Button>
            )}

            {actions.showUnarchive && (
              <Button
                disabled={actions.isFormDirty}
                loading={actions.loading}
                onClick={actions.onUnarchive}
              >
                {t('lotForm.actions.unarchive')}
              </Button>
            )}

            <Button
              type="submit"
              loading={actions.loading}
              disabled={!actions.isFormDirty}
            >
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </form>
      <ConfirmModal
        opened={confirmOpened}
        onCancel={() => setConfirmOpened(false)}
        onConfirm={handleConfirm}
        title={t('lotForm.confirm.saveTitle')}
        message={t('lotForm.confirm.saveMessage')}
        confirmLabel={t('common.save')}
        cancelLabel={t('lotForm.actions.cancel')}
        loading={actions.loading}
      />
    </>
  );
};
