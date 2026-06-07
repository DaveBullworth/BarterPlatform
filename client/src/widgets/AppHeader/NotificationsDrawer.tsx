import {
  Box,
  Button,
  Center,
  Drawer,
  Group,
  Loader,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/entities/user';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  type Notification,
} from '@/entities/notification';
import { formatDate } from '@/shared/lib/formatters';
import drawerStyles from '@/shared/ui/MobileDrawer.module.scss';

type Props = {
  opened: boolean;
  onClose: () => void;
};

export const NotificationsDrawer = ({ opened, onClose }: Props) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading } = useNotifications(
    { page: 1, limit: 20 },
    isAuthenticated && opened,
  );
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  const items = data?.data ?? [];
  const hasUnread = items.some((n) => !n.isRead);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="lg"
      title={t('notifications.title')}
      className={drawerStyles.bottomTitleOnMobile}
    >
      <Stack gap="xs">
        {hasUnread && (
          <Group justify="flex-end">
            <Button
              variant="subtle"
              size="xs"
              onClick={() => markAll.mutate()}
              loading={markAll.isPending}
            >
              {t('notifications.markAllRead')}
            </Button>
          </Group>
        )}

        {isLoading && (
          <Center py="md">
            <Loader size="sm" color="barter" />
          </Center>
        )}

        {!isLoading && items.length === 0 && (
          <Text size="sm" c="dimmed">
            {t('notifications.empty')}
          </Text>
        )}

        {items.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            locale={i18n.language}
            onClick={() => {
              if (!notification.isRead) markOne.mutate(notification.id);
            }}
          />
        ))}
      </Stack>
    </Drawer>
  );
};

type ItemProps = {
  notification: Notification;
  locale: string;
  onClick: () => void;
};

const NotificationItem = ({ notification, locale, onClick }: ItemProps) => {
  const { t } = useTranslation();

  const base = `notifications.items.${notification.subtype}`;
  const title = t(`${base}.title`, {
    defaultValue: t('notifications.items.fallback.title'),
  });
  const body = t(`${base}.body`, {
    ...notification.payload,
    defaultValue: t('notifications.items.fallback.body'),
  });

  return (
    <UnstyledButton
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        background: notification.isRead
          ? undefined
          : 'var(--mantine-color-default-hover)',
      }}
    >
      <Group wrap="nowrap" justify="space-between" align="flex-start" gap="xs">
        <div style={{ minWidth: 0 }}>
          <Text fw={notification.isRead ? 500 : 700} size="sm" lineClamp={2}>
            {title}
          </Text>
          {body && (
            <Text size="xs" c="dimmed" lineClamp={3}>
              {body}
            </Text>
          )}
          <Text size="xs" c="dimmed" mt={4}>
            {formatDate(notification.createdAt, locale)}
          </Text>
        </div>
        {!notification.isRead && (
          <Box
            w={8}
            h={8}
            mt={6}
            style={{
              borderRadius: '50%',
              background: 'var(--mantine-color-red-6)',
              flexShrink: 0,
            }}
          />
        )}
      </Group>
    </UnstyledButton>
  );
};
