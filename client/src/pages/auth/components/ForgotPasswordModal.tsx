import { useState } from 'react';
import { Modal, Button, TextInput, Group, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { createEmailValidator } from '@/shared/utils/validators';
import { requestPasswordReset } from '@/http/password.reset';
import { notify } from '@/shared/utils/notifications';
import { handleApiError } from '@/shared/utils/handleApiError';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal = ({ opened, onClose }: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: createEmailValidator(t),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);

      const data = await requestPasswordReset({ email: values.email });

      if (data.result === 'sent') {
        notify({
          message: t('auth.passwordResetSent'),
          color: 'green',
        });
      } else if (data.result === 'already_requested') {
        notify({
          message: t('auth.passwordResetAlreadyRequested', {
            hours: data.waitHours?.toFixed(1),
          }),
          color: 'yellow',
          autoClose: undefined, // висит пока пользователь не закроет
        });
      }

      onClose();
      form.reset();
    } catch (e) {
      handleApiError(e, t);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t('auth.forgotPassword')}
      centered
    >
      <Text mb="sm">{t('auth.forgotPasswordText')}</Text>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label={t('auth.email')}
          placeholder="example@mail.com"
          {...form.getInputProps('email')}
        />

        <Group justify="flex-end" mt="md" gap="xs">
          <Button variant="default" onClick={handleClose}>
            {t('auth.close')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('auth.send')}
          </Button>
        </Group>
      </form>
    </Modal>
  );
};
