import { Stack, Group, Text, Button, Loader, Center } from '@mantine/core';
import { modals } from '@mantine/modals';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useSessions,
  useTerminateSession,
  useTerminateOtherSessions,
  type Session,
} from '@/entities/session';
import { handleApiError, notify } from '@/shared/lib';
import { SessionRow } from './SessionRow';

type Props = {
  // undefined → свои сессии; иначе — сессии конкретного пользователя (ADMIN)
  userId?: string;
};

export const ProfileSessionsBlock = ({ userId }: Props) => {
  const { t } = useTranslation();
  const isAdminView = Boolean(userId);

  const { data: sessions, isLoading } = useSessions(userId);
  const terminate = useTerminateSession(userId);
  const terminateOthers = useTerminateOtherSessions(userId);

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="md">
        {t('sessions.empty')}
      </Text>
    );
  }

  const confirmTerminate = (session: Session) =>
    modals.openConfirmModal({
      title: t('sessions.confirmTitle'),
      children: <Text size="sm">{t('sessions.confirmText')}</Text>,
      labels: { confirm: t('sessions.confirm'), cancel: t('sessions.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        terminate.mutate(session.id, {
          onSuccess: () =>
            notify({ message: t('sessions.terminated'), color: 'green' }),
          onError: (error) =>
            handleApiError(error, t, { defaultMessage: t('sessions.error') }),
        }),
    });

  const confirmTerminateOthers = () =>
    modals.openConfirmModal({
      title: isAdminView
        ? t('sessions.confirmAllTitle')
        : t('sessions.confirmOthersTitle'),
      children: (
        <Text size="sm">
          {isAdminView
            ? t('sessions.confirmAllText')
            : t('sessions.confirmOthersText')}
        </Text>
      ),
      labels: { confirm: t('sessions.confirm'), cancel: t('sessions.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        terminateOthers.mutate(undefined, {
          onSuccess: () =>
            notify({ message: t('sessions.terminatedOthers'), color: 'green' }),
          onError: (error) =>
            handleApiError(error, t, { defaultMessage: t('sessions.error') }),
        }),
    });

  // Для себя «оптовая» кнопка имеет смысл, если есть не-текущие сессии;
  // для админа — если есть хоть одна.
  const hasOthers = sessions.some((s) => !s.current);
  const showBulk = isAdminView ? sessions.length > 0 : hasOthers;

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {isAdminView ? t('sessions.subtitleAdmin') : t('sessions.subtitle')}
      </Text>

      <Stack gap="xs">
        {sessions.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            // свою текущую сессию отсюда не завершаем (выход — через логаут)
            canTerminate={isAdminView || !session.current}
            terminating={terminate.isPending}
            onTerminate={() => confirmTerminate(session)}
          />
        ))}
      </Stack>

      {showBulk && (
        <Group justify="flex-end">
          <Button
            variant="light"
            color="red"
            leftSection={<LogOut size={16} />}
            loading={terminateOthers.isPending}
            onClick={confirmTerminateOthers}
          >
            {isAdminView
              ? t('sessions.terminateAll')
              : t('sessions.terminateOthers')}
          </Button>
        </Group>
      )}
    </Stack>
  );
};
