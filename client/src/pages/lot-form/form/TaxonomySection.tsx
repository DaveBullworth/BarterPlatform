import { Card, Stack, Text, TextInput, Button } from '@mantine/core';
import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';

export type TaxonomySectionProps = {
  value: string;
  error?: ReactNode;
  onOpen: () => void;
  t: TFunction;
};

export const TaxonomySection = ({
  value,
  error,
  onOpen,
  t,
}: TaxonomySectionProps) => {
  return (
    <Card withBorder radius="md" p="md">
      <Stack>
        <Text fw={700}>{t('lotForm.taxonomy.title')}</Text>

        <TextInput
          label={t('lotForm.taxonomy.selected')}
          placeholder={t('lotForm.taxonomy.placeholder')}
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
          {t('lotForm.taxonomy.selectButton')}
        </Button>
      </Stack>
    </Card>
  );
};
