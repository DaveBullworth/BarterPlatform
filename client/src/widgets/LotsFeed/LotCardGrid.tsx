import { Card, Stack, Text, Button, Checkbox, Tooltip } from '@mantine/core';
import { ImageOff, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { KeyboardEvent } from 'react';

import { formatDate } from '@/shared/lib/formatters';
import { preload } from '@/shared/lib/preload';
import type { LotResponse } from '@/entities/lot';

import styles from './LotsFeed.module.scss';
import { relevanceGlowClass } from './relevanceGlow';

type Props = {
  lot: LotResponse;
  imageSrc: string | null;
  locale: string;
  onOpen: (id: string) => void;
  onExchange: (lot: LotResponse) => void;
  /** Не показывать кнопку "Обменяться" (например, в ленте "Мои лоты"). */
  hideExchange?: boolean;
  /** Кнопка обмена видна, но заблокирована (исключительный случай — админ). */
  exchangeDisabled?: boolean;

  /** Режим выбора (модалка обмена): вместо кнопки — чекбокс. */
  selectable?: boolean;
  selected?: boolean;
  /** Лот вне предпочтений получателя — выбрать нельзя. */
  selectionDisabled?: boolean;
  onSelectToggle?: (lot: LotResponse) => void;
};

export const LotCardGrid = ({
  lot,
  imageSrc,
  locale,
  onOpen,
  onExchange,
  hideExchange = false,
  exchangeDisabled = false,
  selectable = false,
  selected = false,
  selectionDisabled = false,
  onSelectToggle,
}: Props) => {
  const { t } = useTranslation();

  const handleActivate = () => {
    if (selectable) {
      if (!selectionDisabled) onSelectToggle?.(lot);
      return;
    }
    onOpen(lot.id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  const locationLabel = [lot.city?.name, lot.region?.name]
    .filter(Boolean)
    .join(', ');

  const cardClass = [
    styles.clickableCard,
    selectable ? '' : relevanceGlowClass(lot.relevanceLevel),
    selectable && selected ? styles.selectedCard : '',
    selectable && selectionDisabled ? styles.disabledCard : '',
  ]
    .filter(Boolean)
    .join(' ');

  const selectLabel = selectionDisabled
    ? t('feed.exchange.notOfferable')
    : selected
      ? t('feed.exchange.selected')
      : t('feed.exchange.select');

  return (
    <Card
      className={cardClass}
      padding="sm"
      role={selectable ? 'checkbox' : 'link'}
      aria-checked={selectable ? selected : undefined}
      aria-disabled={selectable && selectionDisabled ? true : undefined}
      tabIndex={selectable && selectionDisabled ? -1 : 0}
      onClick={handleActivate}
      onMouseEnter={selectable ? undefined : () => preload('lot')}
      onTouchStart={selectable ? undefined : () => preload('lot')}
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

        {selectable ? (
          <Checkbox
            mt="auto"
            checked={selected}
            disabled={selectionDisabled}
            readOnly
            color="barter"
            label={selectLabel}
          />
        ) : (
          !hideExchange && (
            <Tooltip
              label={t('feed.exchange.ownLot')}
              disabled={!exchangeDisabled}
              withArrow
            >
              <Button
                mt="auto"
                variant="light"
                fullWidth
                data-disabled={exchangeDisabled || undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  if (exchangeDisabled) return;
                  onExchange(lot);
                }}
              >
                {t('feed.exchange.action')}
              </Button>
            </Tooltip>
          )
        )}
      </Stack>
    </Card>
  );
};
