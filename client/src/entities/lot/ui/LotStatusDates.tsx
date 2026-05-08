import { Badge, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/shared/lib';
import { getLotStatusMeta, LOT_STATUS, type LotStatus } from '@/entities/lot';

type Props = {
  visibilityStatus: LotStatus;
  createdAt: string;
  archivationDate: string | null;
};

export const LotStatusDates = ({
  visibilityStatus,
  createdAt,
  archivationDate,
}: Props) => {
  const { t, i18n } = useTranslation();
  const statusMeta = getLotStatusMeta(visibilityStatus);

  return (
    <Group>
      <Badge size="lg" color={statusMeta.color}>
        {t(statusMeta.labelKey)}
      </Badge>
      <Text c="dimmed">
        {t('lot.createdAt')}: {formatDate(createdAt, i18n.language)}
        {visibilityStatus === LOT_STATUS.ARCHIVED && (
          <>
            {' / '}
            {t('lot.visibility.archived')}{' '}
            {archivationDate ? formatDate(archivationDate, i18n.language) : '—'}
          </>
        )}
      </Text>
    </Group>
  );
};
