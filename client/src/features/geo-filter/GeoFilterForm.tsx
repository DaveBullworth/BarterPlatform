import type { GeoFilterValue } from '@/shared/lib/geoFilter';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Stack, Group, Button } from '@mantine/core';
import { GeoSelector } from '@/shared/ui';
import {
  useRegionOptions,
  useCityOptions,
  useDistrictOptions,
} from '@/entities/geography';

type Props = {
  initialValue: GeoFilterValue;
  onApply: (value: GeoFilterValue) => void;
  onReset: () => void;
  onClose: () => void;
};

// Внутренний компонент — пересоздаётся при каждом открытии через key
export const GeoFilterForm = ({
  initialValue,
  onApply,
  onReset,
  onClose,
}: Props) => {
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

      <Group justify="flex-end" mt="sm">
        <Button variant="default" onClick={onReset}>
          {t('categories.reset')}
        </Button>
        <Button variant="default" onClick={onClose}>
          {t('auth.close')}
        </Button>
        <Button onClick={() => onApply(draft)}>{t('common.save')}</Button>
      </Group>
    </Stack>
  );
};
