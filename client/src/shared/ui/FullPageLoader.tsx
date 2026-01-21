import { Center, Stack, Loader, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { LoadingReason } from '@/types/common';

interface FullPageLoaderProps {
  reason?: LoadingReason;
  retryIn?: number | null;
}

export const FullPageLoader = ({ reason, retryIn }: FullPageLoaderProps) => {
  const { t } = useTranslation();

  return (
    <Center h="100vh">
      <Stack align="center" gap="sm">
        {reason === 'RATE_LIMIT' && (
          <Text size="sm" c="dimmed" ta="center">
            {t('auth.loginRateLimit')}
          </Text>
        )}

        <div style={{ position: 'relative' }}>
          <Loader size={64} />

          {retryIn !== null && (
            <Text
              size="sm"
              fw={600}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {retryIn}
            </Text>
          )}
        </div>
      </Stack>
    </Center>
  );
};
