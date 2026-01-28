import { useState, useEffect } from 'react';
import { Center, Stack, Loader, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { LoadingReason } from '@/types/common';

interface FullPageLoaderProps {
  reason?: LoadingReason;
  retryIn?: number | null;
}

export const FullPageLoader = ({ reason, retryIn }: FullPageLoaderProps) => {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState<number | null>(retryIn ?? null);

  useEffect(() => {
    if (retryIn === undefined || retryIn === null) return;

    const id = setTimeout(() => setCountdown(retryIn), 0);
    return () => clearTimeout(id);
  }, [retryIn]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

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

          {countdown !== null && countdown > 0 && (
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
              {countdown}
            </Text>
          )}
        </div>
      </Stack>
    </Center>
  );
};
