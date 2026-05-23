import { Card, Group, Stack, Text, ActionIcon, Tooltip } from '@mantine/core';
import { ArrowRightLeft, ImageOff, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
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

export const LotCardList = ({
  lot,
  imageSrc,
  locale,
  onOpen,
  onExchange,
}: Props) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 48em)');

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(lot.id);
    }
  };

  const locationLabel = [lot.city?.name, lot.region?.name]
    .filter(Boolean)
    .join(', ');

  return (
    <Card
      className={`${styles.clickableCard} ${styles.listCard}`}
      role="link"
      tabIndex={0}
      onClick={() => onOpen(lot.id)}
      onKeyDown={handleKeyDown}
    >
      <Group wrap="nowrap" align="stretch" gap={`${isMobile ? 'xs' : 'md'}`}>
        {imageSrc ? (
          <div className={styles.listImage}>
            <img src={imageSrc} alt={lot.generalDescription} loading="lazy" />
          </div>
        ) : (
          <div className={styles.listImageFallback}>
            <ImageOff size={32} strokeWidth={1.5} />
          </div>
        )}

        <Stack className={styles.listCardBody} gap={4}>
          <Text fw={700} size="md" lineClamp={1}>
            {lot.generalDescription}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={2}>
            {lot.characteristicsDescription}
          </Text>

          <Group justify="space-between" mt="auto" gap="xs" wrap="nowrap">
            {locationLabel ? (
              <span className={styles.locationChip}>
                <MapPin size={12} strokeWidth={2} />
                <span className={styles.locationText}>{locationLabel}</span>
              </span>
            ) : (
              <span />
            )}
            <Group gap="sm">
              {lot.quantity > 1 && (
                <Text size="xs" fw={600} c="barter">
                  ×{lot.quantity}
                </Text>
              )}
              <Text size="xs" c="dimmed">
                {formatDate(lot.createdAt, locale)}
              </Text>
            </Group>
          </Group>
        </Stack>

        <Tooltip label={t('feed.exchange.action')} withArrow position="top">
          <ActionIcon
            variant="light"
            color="barter"
            size="lg"
            className={styles.listAction}
            aria-label={t('feed.exchange.action')}
            onClick={(e) => {
              e.stopPropagation();
              onExchange(lot);
            }}
          >
            <ArrowRightLeft size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Card>
  );
};
