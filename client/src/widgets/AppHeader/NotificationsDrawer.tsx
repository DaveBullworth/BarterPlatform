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
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/entities/user';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  NOTIFICATION_ENTITY_TYPE,
  NOTIFICATION_SUBTYPE,
  type Notification,
} from '@/entities/notification';
import { useNavigation } from '@/shared/lib/navigation';
import { formatDate } from '@/shared/lib/formatters';
import drawerStyles from '@/shared/ui/MobileDrawer.module.scss';

type Props = {
  opened: boolean;
  onClose: () => void;
};

export const NotificationsDrawer = ({ opened, onClose }: Props) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { toOfferView, toLotView } = useNavigation();

  const { data, isLoading } = useNotifications(
    { page: 1, limit: 20 },
    isAuthenticated && opened,
  );
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  const items = data?.data ?? [];
  const hasUnread = items.some((n) => !n.isRead);

  /**
   * Переход по deep-link уведомления: предложения открываются на странице
   * предложения (жалобу админ смотрит от лица её отправителя — иначе сервер
   * не пустит не-участника), лоты — на странице лота. Возвращает null, если
   * переходить некуда (нет привязки или сущность удалена).
   */
  const resolveNavigation = (n: Notification): (() => void) | null => {
    const { entityType, entityId, subtype, payload } = n;
    if (!entityId) return null;

    if (entityType === NOTIFICATION_ENTITY_TYPE.OFFER) {
      const reporterId =
        subtype === NOTIFICATION_SUBTYPE.OFFER_REPORTED &&
        typeof payload.reporterId === 'string'
          ? payload.reporterId
          : undefined;
      return () => toOfferView(entityId, reporterId);
    }

    if (
      entityType === NOTIFICATION_ENTITY_TYPE.LOT &&
      subtype !== NOTIFICATION_SUBTYPE.LOT_REMOVED
    ) {
      return () => toLotView(entityId);
    }

    return null;
  };

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

        {items.map((notification) => {
          const navigate = resolveNavigation(notification);
          return (
            <NotificationItem
              key={notification.id}
              notification={notification}
              locale={i18n.language}
              hasLink={Boolean(navigate)}
              onClick={() => {
                if (!notification.isRead) markOne.mutate(notification.id);
                if (navigate) {
                  navigate();
                  onClose();
                }
              }}
            />
          );
        })}
      </Stack>
    </Drawer>
  );
};

type ItemProps = {
  notification: Notification;
  locale: string;
  hasLink: boolean;
  onClick: () => void;
};

const NotificationItem = ({
  notification,
  locale,
  hasLink,
  onClick,
}: ItemProps) => {
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
        <Group gap={6} wrap="nowrap" align="center" style={{ flexShrink: 0 }}>
          {!notification.isRead && (
            <Box
              w={8}
              h={8}
              style={{
                borderRadius: '50%',
                background: 'var(--mantine-color-red-6)',
              }}
            />
          )}
          {hasLink && (
            <ChevronRight size={16} color="var(--mantine-color-dimmed)" />
          )}
        </Group>
      </Group>
    </UnstyledButton>
  );
};
