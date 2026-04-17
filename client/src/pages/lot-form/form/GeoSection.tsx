import { Card, Stack, Text, TextInput, Button } from '@mantine/core';
import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';

export type GeoSectionProps = {
  value: string;
  error?: ReactNode;
  onOpen: () => void;
  t: TFunction;
};

export const GeoSection = ({ value, error, onOpen, t }: GeoSectionProps) => {
  return (
    <Card withBorder radius="md" p="md">
      <Stack>
        <Text fw={700}>{t('lotForm.geo.title')}</Text>

        <TextInput
          label={t('lotForm.geo.selected')}
          placeholder={t('lotForm.geo.placeholder')}
          readOnly
          value={value}
          error={error}
          styles={{
            input: {
              fontStyle: 'italic',
            },
          }}
        />

        <Button variant="default" onClick={onOpen}>
          {t('lotForm.geo.selectButton')}
        </Button>
      </Stack>
    </Card>
  );
};
