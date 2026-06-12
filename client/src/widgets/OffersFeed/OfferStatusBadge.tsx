import { Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { OFFER_STATUS, type OfferStatus } from '@/entities/offer';

import styles from './OffersFeed.module.scss';

// Цвет «лампочки» статуса предложения.
const STATUS_COLOR: Record<OfferStatus, string> = {
  [OFFER_STATUS.PENDING]: 'yellow',
  [OFFER_STATUS.ACCEPTED]: 'blue',
  [OFFER_STATUS.COMPLETED]: 'teal',
  [OFFER_STATUS.REJECTED]: 'red',
};

export const OfferStatusBadge = ({ status }: { status: OfferStatus }) => {
  const { t } = useTranslation();
  const color = STATUS_COLOR[status];

  return (
    <Badge
      color={color}
      variant="light"
      size="sm"
      radius="sm"
      leftSection={
        <span
          className={styles.statusLamp}
          style={{
            background: `var(--mantine-color-${color}-6)`,
            boxShadow: `0 0 6px var(--mantine-color-${color}-5)`,
          }}
        />
      }
    >
      {t(`offers.status.${status}`)}
    </Badge>
  );
};
