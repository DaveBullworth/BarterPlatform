import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Center, Stack, Text, Title, Loader } from '@mantine/core';
import { CircleCheckBig, CircleOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { confirmEmail } from '@/http/mail.confirm';

type Status = 'loading' | 'success' | 'error';

export const MailConfirmPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const hasRequestedRef = useRef(false);

  // начальное состояние вычисляется синхронно
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');

  useEffect(() => {
    if (!token) return;
    if (hasRequestedRef.current) return;

    hasRequestedRef.current = true;

    confirmEmail(token)
      .then(() => {
        setStatus('success');

        setTimeout(() => {
          navigate('/auth');
        }, 4000);
      })
      .catch(() => {
        setStatus('error');
      });
  }, [token, navigate]);

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
