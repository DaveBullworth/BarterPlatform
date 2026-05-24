import { Calendar, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/shared/lib';
import { getLotStatusMeta, LOT_STATUS, type LotStatus } from '@/entities/lot';

type Props = {
  visibilityStatus: LotStatus;
  createdAt: string;
  archivationDate: string | null;
  /** Кастомизация классов под страницу. */
  classes?: {
    container?: string;
    badge?: string;
    badgeActive?: string;
    badgeArchived?: string;
    badgeHidden?: string;
    dot?: string;
  };
};

export const LotStatusDates = ({
  visibilityStatus,
  createdAt,
  archivationDate,
  classes = {},
}: Props) => {
  const { t, i18n } = useTranslation();
  const statusMeta = getLotStatusMeta(visibilityStatus);

  const badgeClass = [
    classes.badge,
    visibilityStatus === LOT_STATUS.ACTIVE && classes.badgeActive,
    visibilityStatus === LOT_STATUS.ARCHIVED && classes.badgeArchived,
    visibilityStatus === LOT_STATUS.HIDDEN && classes.badgeHidden,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes.container}>
      <span className={badgeClass}>
        <Circle
          size={8}
          fill="currentColor"
          stroke="none"
        />
        <span>{t(statusMeta.labelKey)}</span>
      </span>

      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Calendar size={13} strokeWidth={2} />
        <span>
          {t('lot.createdAt')}: {formatDate(createdAt, i18n.language)}
        </span>
      </span>

      {visibilityStatus === LOT_STATUS.ARCHIVED && (
        <span>
          · {t('lot.visibility.archived')}{' '}
          {archivationDate ? formatDate(archivationDate, i18n.language) : '—'}
        </span>
      )}
    </div>
  );
};
