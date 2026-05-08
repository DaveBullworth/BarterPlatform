import { Card, Stack, Group, Text, Image, Button } from '@mantine/core';
import { CameraOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { KeyboardEvent } from 'react';

import { formatDate } from '@/shared/lib/formatters';
import type { LotResponse } from '@/entities/lot';

import styles from './LotsFeed.module.scss';

type Props = {
  lot: LotResponse;
  imageSrc: string | null;
  locale: string;
  onOpen: (id: string) => void;
  onExchange: (lot: LotResponse) => void;
};

export const LotCardGrid = ({
  lot,
  imageSrc,
  locale,
  onOpen,
  onExchange,
}: Props) => {
  const { t } = useTranslation();

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(lot.id);
    }
  };

  return (
    <Card
      withBorder
      padding="sm"
      className={styles.clickableCard}
      role="link"
      tabIndex={0}
      onClick={() => onOpen(lot.id)}
      onKeyDown={handleKeyDown}
    >
      <Stack className={styles.gridCard}>
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={lot.generalDescription}
            radius="sm"
            style={{ aspectRatio: '1 / 1', height: '70%' }}
            fit="cover"
          />
        ) : (
          <Stack gap="sm" align="center" className={styles.gridImageFallback}>
            <CameraOff size={42} />
            <Text size="sm">{t('lot.noImages')}</Text>
          </Stack>
        )}

        <Stack gap={4}>
          <Text fw={700} lineClamp={2}>
            {lot.generalDescription}
          </Text>
          <Text
            size="sm"
            c="dimmed"
            lineClamp={2}
            style={{ minHeight: '40px' }}
          >
            {lot.characteristicsDescription}
          </Text>
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              {formatDate(lot.createdAt, locale)}
            </Text>
            {lot.quantity !== 1 && (
              <Text fw={700} size="sm">
                {lot.quantity}
              </Text>
            )}
          </Group>
        </Stack>

        <Button
          mt="auto"
          variant="light"
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
            onExchange(lot);
          }}
        >
          {t('feed.exchange.action')}
        </Button>
      </Stack>
    </Card>
  );
};
