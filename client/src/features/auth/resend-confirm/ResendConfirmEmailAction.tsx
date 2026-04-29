import { useState } from 'react';
import { Button, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { notify, handleApiError } from '@/shared/lib';
import { userApi } from '@/entities/user';

type Props = {
  loginOrEmail: string;
};

export const ResendConfirmEmailAction = ({ loginOrEmail }: Props) => {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => userApi.resendConfirmEmail(loginOrEmail),
    onSuccess: () => {
      setSent(true);
      notify({ message: t('auth.confirmEmailResent'), color: 'green' });
    },
    onError: (error) => handleApiError(error, t),
  });

  return (
    <Group gap="xs">
      <Text size="sm">{t('auth.emailNotConfirmed')}</Text>
      <Button
        size="xs"
        variant="light"
        loading={isPending}
        disabled={sent}
        onClick={() => mutate()}
      >
        {t('auth.resend')}
      </Button>
    </Group>
  );
};
