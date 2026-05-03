import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Center, Stack, Text, Title, Loader } from '@mantine/core';
import { CircleCheckBig, CircleOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import { useNavigation } from '@/shared/lib/navigation';
import { userApi } from '@/entities/user';

type Status = 'loading' | 'success' | 'error';

export const MailConfirmPage = () => {
  const { t } = useTranslation();
  const { toAuth } = useNavigation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const hasRequestedRef = useRef(false);

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');

  const { mutate } = useMutation({
    mutationFn: (token: string) => userApi.confirmEmail(token),
    onSuccess: () => {
      setStatus('success');
      setTimeout(toAuth, 4000);
    },
    onError: () => setStatus('error'),
  });

  useEffect(() => {
    if (!token || hasRequestedRef.current) return;
    hasRequestedRef.current = true;
    mutate(token);
  }, [token, mutate]);

  return (
    <Center h="100%">
      <Stack align="center" gap="md" maw={420}>
        {status === 'loading' && (
          <>
            <Loader />
            <Text>{t('mailConfirm.loading')}</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <CircleCheckBig size={48} color="green" />
            <Title order={3}>{t('mailConfirm.successTitle')}</Title>
            <Text ta="center">{t('mailConfirm.successText')}</Text>
            <Text size="sm" c="dimmed">
              {t('mailConfirm.redirect')}
            </Text>
          </>
        )}

        {status === 'error' && (
          <>
            <CircleOff size={48} color="red" />
            <Title order={3}>{t('mailConfirm.errorTitle')}</Title>
            <Text ta="center">
              {token ? t('mailConfirm.errorText') : t('mailConfirm.noToken')}
            </Text>
          </>
        )}
      </Stack>
    </Center>
  );
};
