import { useTranslation } from 'react-i18next';
import { Modal, Button, TextInput, Group, Text, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Mail } from 'lucide-react';
import { useForgotPassword } from './useForgotPassword';
import { createMantineValidators } from '@/shared/lib/validators';

type Props = {
  opened: boolean;
  onClose: () => void;
};

export const ForgotPasswordModal = ({ opened, onClose }: Props) => {
  const { t } = useTranslation();
  const validators = createMantineValidators(t);
  const { submit, isLoading } = useForgotPassword({ onSuccess: onClose });

  const form = useForm({
    initialValues: { email: '' },
    validate: { email: validators.email },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={700} size="lg" td="underline">
          {t('auth.forgotPassword')}
        </Text>
      }
      centered
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <Stack>
        <Text>{t('auth.forgotPasswordText')}</Text>
        <form onSubmit={form.onSubmit(({ email }) => submit(email))}>
          <Stack>
            <TextInput
              variant="underline"
              leftSection={<Mail size={16} />}
              label={t('auth.email')}
              placeholder="example@mail.com"
              {...form.getInputProps('email')}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={handleClose}>
                {t('auth.close')}
              </Button>
              <Button type="submit" loading={isLoading}>
                {t('auth.send')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
};
