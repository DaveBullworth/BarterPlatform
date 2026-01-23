import { Button, Group, Text } from '@mantine/core';
import { useState } from 'react';
import { resendConfirmEmail } from '@/http/mail.confirm';
import { notify } from '@/shared/utils/notifications';
import { handleApiError } from '@/shared/utils/handleApiError';
import { useTranslation } from 'react-i18next';

interface Props {
  loginOrEmail: string;
}

export const ResendConfirmEmailAction = ({ loginOrEmail }: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    try {
      setLoading(true);
      await resendConfirmEmail({ loginOrEmail });

      setSent(true);

      notify({
        message: t('auth.confirmEmailResent'),
        color: 'green',
      });
    } catch (e) {
      handleApiError(e, t);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Group gap="xs">
      <Text size="sm">{t('auth.emailNotConfirmed')}</Text>
      <Button
        size="xs"
        variant="light"
        loading={loading}
        disabled={sent}
        onClick={handleResend}
      >
        {t('auth.resend')}
      </Button>
    </Group>
  );
};
