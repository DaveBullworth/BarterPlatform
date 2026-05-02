import {
  Card,
  Group,
  Stack,
  Text,
  Image,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { ArrowRightLeft, CameraOff } from 'lucide-react';
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

export const LotCardList = ({
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
      <Group wrap="nowrap" align="stretch">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={lot.generalDescription}
            w={80}
            h={80}
            radius="sm"
            fit="cover"
          />
        ) : (
          <Stack gap="sm" align="center" className={styles.listImageFallback}>
            <CameraOff size={42} />
            <Text size="sm">{t('lot.noImages')}</Text>
          </Stack>
        )}

        <Stack gap={2} className={styles.listCardBody}>
          <Text fw={700} size="lg" lineClamp={1}>
            {lot.generalDescription}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={2}>
            {lot.characteristicsDescription}
          </Text>
          <Group justify="space-between" mt="auto">
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

        <Tooltip label={t('feed.exchange.action')} withArrow position="top">
          <ActionIcon
            variant="light"
            color="blue"
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
