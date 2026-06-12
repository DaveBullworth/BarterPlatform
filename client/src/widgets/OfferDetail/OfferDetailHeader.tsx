import { Group, Stack, Text, Avatar, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { getUserAvatarUrl } from '@/entities/user';
import { type OfferDetail } from '@/entities/offer';
import { OfferStatusStepper } from './OfferStatusStepper';

type Props = {
  offer: OfferDetail;
  locale: string;
};

export const OfferDetailHeader = ({ offer, locale }: Props) => {
  const { t } = useTranslation();
  const created = new Date(offer.createdAt).toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Stack gap="lg">
      <Group gap="md" align="center" wrap="nowrap">
        <Avatar src={getUserAvatarUrl(offer.counterpart.id)} size={72} radius="xl" />
        <Stack gap={2}>
          <Title order={3}>
            {offer.counterpart.name || t('offers.detail.unknownUser')}
          </Title>
          <Text size="sm" c="dimmed">
            {t('offers.detail.createdAt', { date: created })}
          </Text>
        </Stack>
      </Group>

      <OfferStatusStepper offer={offer} locale={locale} />
    </Stack>
  );
};
