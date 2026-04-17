import {
  GeoSelector,
  type GeoValue,
  type SelectOption,
} from '@/shared/ui/GeoSelector';
import { Button, Group, Modal, Stack } from '@mantine/core';
import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';

type Props = {
  opened: boolean;
  onClose: () => void;

  value: GeoValue;
  onChange: (value: GeoValue) => void;

  regionOptions: SelectOption[];
  cityOptions: SelectOption[];
  districtOptions: SelectOption[];

  onRegionChange: (value: string | null) => void;
  onCityChange: (value: string | null) => void;

  errors: {
    regionId?: ReactNode;
    cityId?: ReactNode;
  };

  t: TFunction;
};

const GeoModal = ({
  opened,
  onClose,
  value,
  onChange,
  regionOptions,
  cityOptions,
  districtOptions,
  onRegionChange,
  onCityChange,
  errors,
  t,
}: Props) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('lotForm.geo.modalTitle')}
      centered
    >
      <Stack gap="sm">
        <GeoSelector
          value={value}
          onChange={(val) => {
            onChange(val);
          }}
          regionOptions={regionOptions}
          cityOptions={cityOptions}
          districtOptions={districtOptions}
          onRegionChange={onRegionChange}
          onCityChange={onCityChange}
          errors={{
            regionId: errors.regionId,
            cityId: errors.cityId,
          }}
        />

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            {t('auth.close')}
          </Button>
          <Button onClick={onClose} disabled={!value.regionId || !value.cityId}>
            {t('common.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default GeoModal;
