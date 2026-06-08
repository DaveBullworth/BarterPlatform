import { Group, Text, ActionIcon, Badge, ThemeIcon } from '@mantine/core';
import { Monitor, Smartphone, Tablet, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { parseUserAgent, type Session, type DeviceKind } from '@/entities/session';

import styles from './ProfileSessionsBlock.module.scss';

const ICON_BY_KIND: Record<DeviceKind, typeof Monitor> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

type Props = {
  session: Session;
  canTerminate: boolean;
  terminating: boolean;
  onTerminate: () => void;
};

export const SessionRow = ({
  session,
  canTerminate,
  terminating,
  onTerminate,
}: Props) => {
  const { t, i18n } = useTranslation();

  const ua = parseUserAgent(session.userAgent);
  const DeviceIcon = ICON_BY_KIND[ua.kind];
  const title = ua.label || t('sessions.unknownDevice');

  const lastActive = session.lastSeenAt ?? session.createdAt;
  const date = new Date(lastActive);
  const lastActiveLabel = Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  return (
    <div className={styles.row}>
      <ThemeIcon
        variant="light"
        color={session.current ? 'barter' : 'gray'}
        size={40}
        radius="md"
      >
        <DeviceIcon size={20} strokeWidth={2} />
      </ThemeIcon>

      <div className={styles.info}>
        <Group gap="xs" wrap="nowrap">
          <Text fw={600} size="sm" lineClamp={1}>
            {title}
          </Text>
          {session.current && (
            <Badge size="xs" color="barter" variant="light">
              {t('sessions.current')}
            </Badge>
          )}
        </Group>
        <Text size="xs" c="dimmed" lineClamp={1}>
          {session.ip ? `${session.ip} · ` : ''}
          {t('sessions.lastActive', { date: lastActiveLabel })}
        </Text>
      </div>

      {canTerminate && (
        <ActionIcon
          variant="subtle"
          color="red"
          size="lg"
          aria-label={t('sessions.terminate')}
          loading={terminating}
          onClick={onTerminate}
        >
          <Trash2 size={18} />
        </ActionIcon>
      )}
    </div>
  );
};
