import { Stack, Title, Text, Group } from '@mantine/core';
import { Boxes } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LotsFeed } from '@/widgets/LotsFeed';

export const MyLotsPage = () => {
  const { t } = useTranslation();

  return (
    <Stack gap="md" w="100%">
      <Group gap="sm" align="center">
        <Boxes
          size={28}
          strokeWidth={1.8}
          color="var(--mantine-color-barter-6)"
        />
        <Stack gap={2}>
          <Title order={2}>{t('nav.myLots')}</Title>
          <Text size="sm" c="dimmed">
            {t('myLots.description', {
              defaultValue: 'All lots you have published',
            })}
          </Text>
        </Stack>
      </Group>

      <LotsFeed selfOnly />
    </Stack>
  );
};
