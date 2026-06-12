import { Stack, Title, Text, Group } from '@mantine/core';
import { Handshake } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { OffersFeed } from '@/widgets/OffersFeed';

export const OffersPage = () => {
  const { t } = useTranslation();

  return (
    <Stack gap="md" w="100%">
      <Group gap="sm" align="center">
        <Handshake
          size={28}
          strokeWidth={1.8}
          color="var(--mantine-color-barter-6)"
        />
        <Stack gap={2}>
          <Title order={2}>{t('offers.title')}</Title>
          <Text size="sm" c="dimmed">
            {t('offers.description')}
          </Text>
        </Stack>
      </Group>

      <OffersFeed />
    </Stack>
  );
};
