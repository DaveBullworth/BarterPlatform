import { useState } from 'react';
import {
  Card,
  Stack,
  Text,
  TextInput,
  Button,
  Group,
  Modal,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

import { GeoSelector, type GeoValue } from '@/shared/ui/GeoSelector';
import {
  useRegionOptions,
  useCityOptions,
  useDistrictOptions,
} from '@/entities/geography';

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
      <Group justify="flex-end" mt="sm">
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

  return (
    <>
      <Card withBorder radius="md" p="md">
        <Stack>
          <Text fw={700}>{t('lotForm.geo.title')}</Text>
          <TextInput
            label={t('lotForm.geo.selected')}
            placeholder={t('lotForm.geo.placeholder')}
            readOnly
            value={displayPath}
            error={error}
            styles={{ input: { fontStyle: 'italic' } }}
          />
          <Button variant="default" onClick={() => setOpened(true)}>
            {t('lotForm.geo.selectButton')}
          </Button>
        </Stack>
      </Card>

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
