import { Card, Stack, Text, Button } from '@mantine/core';
import { ImageOff, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { KeyboardEvent } from 'react';

import { formatDate } from '@/shared/lib/formatters';
import { preload } from '@/shared/lib/preload';
import type { LotResponse } from '@/entities/lot';

import styles from './LotsFeed.module.scss';

type Props = {
  lot: LotResponse;
  imageSrc: string | null;
  locale: string;
  onOpen: (id: string) => void;
  onExchange: (lot: LotResponse) => void;
  /** Не показывать кнопку "Обменяться" (например, в ленте "Мои лоты"). */
  hideExchange?: boolean;
};

export const LotCardGrid = ({
  lot,
  imageSrc,
  locale,
  onOpen,
  onExchange,
  hideExchange = false,
}: Props) => {
  const { t } = useTranslation();

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
      className={styles.clickableCard}
      padding="sm"
      role="link"
      tabIndex={0}
      onClick={() => onOpen(lot.id)}
      onMouseEnter={() => preload('lot')}
      onTouchStart={() => preload('lot')}
      onKeyDown={handleKeyDown}
    >
      <Stack className={styles.gridCard}>
        <div style={{ position: 'relative' }}>
          {imageSrc ? (
            <div className={styles.gridImage}>
              <img src={imageSrc} alt={lot.generalDescription} loading="lazy" />
            </div>
          ) : (
            <div className={styles.gridImageFallback}>
              <ImageOff size={36} strokeWidth={1.5} />
              <Text size="xs">{t('lot.noImages')}</Text>
            </div>
          )}

          {lot.quantity > 1 && (
            <span className={styles.quantityBadge}>×{lot.quantity}</span>
          )}
        </div>

        <Stack gap={4}>
          <Text fw={700} lineClamp={2} style={{ minHeight: '2.6em' }}>
            {lot.generalDescription}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={2} style={{ minHeight: '2.6em' }}>
            {lot.characteristicsDescription}
          </Text>
        </Stack>

        <div className={styles.metaRow}>
          {locationLabel && (
            <span className={styles.locationChip}>
              <MapPin size={12} strokeWidth={2} />
              <span>{locationLabel}</span>
            </span>
          )}
          <Text size="xs" c="dimmed">
            {formatDate(lot.createdAt, locale)}
          </Text>
        </div>

        {!hideExchange && (
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
        )}
      </Stack>
    </Card>
  );
};
