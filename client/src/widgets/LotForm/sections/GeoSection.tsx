import { useState } from 'react';
import { Button, Modal, Stack, Group } from '@mantine/core';
import { MapPin, Pencil, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

import {
  useRegionOptions,
  useCityOptions,
  useDistrictOptions,
  GeoSelector,
  type GeoValue,
} from '@/entities/geography';

import styles from '../LotForm.module.scss';

type Props = {
  value: GeoValue;
  displayPath: string;
  error?: ReactNode;
  onChange: (value: GeoValue) => void;
};

const GeoForm = ({
  initialValue,
  onChange,
  onClose,
}: {
  initialValue: GeoValue;
  onChange: (value: GeoValue) => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initialValue);

  const regionId = draft.regionId ? Number(draft.regionId) : null;
  const cityId = draft.cityId ? Number(draft.cityId) : null;

  const regionOptions = useRegionOptions();
  const cityOptions = useCityOptions(regionId);
  const districtOptions = useDistrictOptions(cityId);

  return (
    <Stack gap="sm">
      <GeoSelector
        value={draft}
        onChange={setDraft}
        regionOptions={regionOptions}
        cityOptions={cityOptions}
        districtOptions={districtOptions}
      />
      <Group justify="flex-end" mt="sm" gap="xs">
        <Button variant="default" onClick={onClose}>
          {t('auth.close')}
        </Button>
        <Button
          onClick={() => {
            onChange(draft);
            onClose();
          }}
          disabled={!draft.regionId || !draft.cityId}
        >
          {t('common.save')}
        </Button>
      </Group>
    </Stack>
  );
};

export const GeoSection = ({ value, displayPath, error, onChange }: Props) => {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const isFilled = Boolean(displayPath);

  const summaryClass = [
    styles.summary,
    isFilled ? styles.summaryFilled : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className={summaryClass}>
        <span className={styles.summaryIcon}>
          <MapPin size={16} strokeWidth={2} />
        </span>
        <div className={styles.summaryBody}>
          {isFilled ? (
            <span className={styles.summaryPath}>{displayPath}</span>
          ) : (
            <span className={styles.summaryPlaceholder}>
              {t('lotForm.geo.placeholder')}
            </span>
          )}
          {error && <span className={styles.summaryError}>{error}</span>}
        </div>
        <Button
          variant={isFilled ? 'default' : 'filled'}
          size="xs"
          className={styles.summaryAction}
          leftSection={
            isFilled ? <Pencil size={14} /> : <Plus size={14} />
          }
          onClick={() => setOpened(true)}
        >
          {t('lotForm.geo.selectButton')}
        </Button>
      </div>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('lotForm.geo.modalTitle')}
        centered
      >
        {opened && (
          <GeoForm
            key={JSON.stringify(value)}
            initialValue={value}
            onChange={onChange}
            onClose={() => setOpened(false)}
          />
        )}
      </Modal>
    </>
  );
};
