import {
  Card,
  Group,
  Stack,
  Text,
  ActionIcon,
  Tooltip,
  Checkbox,
} from '@mantine/core';
import { ArrowRightLeft, ImageOff, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
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

export const LotCardList = ({
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
  const isMobile = useMediaQuery('(max-width: 48em)');

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
    styles.listCard,
    selectable ? '' : relevanceGlowClass(lot.relevanceLevel),
    selectable && selected ? styles.selectedCard : '',
    selectable && selectionDisabled ? styles.disabledCard : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Card
      className={cardClass}
      role={selectable ? 'checkbox' : 'link'}
      aria-checked={selectable ? selected : undefined}
      aria-disabled={selectable && selectionDisabled ? true : undefined}
      tabIndex={selectable && selectionDisabled ? -1 : 0}
      onClick={handleActivate}
      onMouseEnter={selectable ? undefined : () => preload('lot')}
      onTouchStart={selectable ? undefined : () => preload('lot')}
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
            <Group gap="sm" wrap="nowrap">
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

        {selectable ? (
          <Checkbox
            className={styles.listAction}
            checked={selected}
            disabled={selectionDisabled}
            readOnly
            color="barter"
            aria-label={t('feed.exchange.select')}
          />
        ) : (
          !hideExchange && (
            <Tooltip
              label={
                exchangeDisabled
                  ? t('feed.exchange.ownLot')
                  : t('feed.exchange.action')
              }
              withArrow
              position="top"
            >
              <ActionIcon
                variant="light"
                color="barter"
                size="lg"
                className={styles.listAction}
                aria-label={t('feed.exchange.action')}
                data-disabled={exchangeDisabled || undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  if (exchangeDisabled) return;
                  onExchange(lot);
                }}
              >
                <ArrowRightLeft size={18} />
              </ActionIcon>
            </Tooltip>
          )
        )}
      </Group>
    </Card>
  );
};
