import { Button, Group, Stack, Text, Title } from '@mantine/core';
import type { TFunction } from 'i18next';
import { ServerCrash, ShieldOff, SearchX, Timer } from 'lucide-react';

type ErrorStubProps = {
  status?: number;
  t: TFunction;
  onRetry?: () => void;
  onBack?: () => void;
};

export const ErrorStub = ({ status, t, onRetry, onBack }: ErrorStubProps) => {
  const config = (() => {
    switch (status) {
      case 404:
        return {
          icon: <SearchX size={48} />,
          title: t('error.notFound.title'),
          description: t('error.notFound.description'),
        };

      case 403:
        return {
          icon: <ShieldOff size={48} />,
          title: t('error.forbidden.title'),
          description: t('error.forbidden.description'),
        };

      case 429:
        return {
          icon: <Timer size={48} />,
          title: t('error.tooManyRequests.title'),
          description: t('error.tooManyRequests.description'),
        };

      default:
        return {
          icon: <ServerCrash size={48} />,
          title: t('common.error'),
          description: t('common.errorDescription'),
        };
    }
  })();

  return (
    <Group justify="center" style={{ width: '100%' }}>
      <Stack align="center" gap="sm" maw={420}>
        <Text size="3rem">{config.icon}</Text>

        <Title order={3} ta="center">
          {config.title}
        </Title>

        <Text size="sm" c="dimmed" ta="center">
          {config.description}
        </Text>

        {(onRetry || onBack) && (
          <Stack gap="xs" mt="md">
            {onRetry && (
              <Button variant="filled" onClick={onRetry}>
                {t('common.retry')}
              </Button>
            )}

            {onBack && (
              <Button variant="light" onClick={onBack}>
                {t('common.back')}
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Group>
  );
};
