import { Button, PasswordInput, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { createMantineValidators } from '@/shared/lib/validators';
import { useResetPassword } from './useResetPassword';

export const ResetPasswordForm = () => {
  const { t } = useTranslation();
  const validators = createMantineValidators(t);
  const { submit, isPending } = useResetPassword();

  const form = useForm({
    initialValues: { password: '', passwordRepeat: '' },
    validate: {
      password: validators.password,
      passwordRepeat: (value, values) =>
        value !== values.password ? t('validation.passwordsDoNotMatch') : null,
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => submit(values))}>
      <Stack gap="md">
        <Text c="dimmed">{t('auth.resetPasswordDescription')}</Text>

        <PasswordInput
          label={t('auth.newPassword')}
          placeholder={t('auth.passwordPlaceholder')}
          {...form.getInputProps('password')}
        />

        <PasswordInput
          label={t('auth.repeatPassword')}
          placeholder={t('auth.repeatPassword')}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          {...form.getInputProps('passwordRepeat')}
        />

        <Button type="submit" loading={isPending}>
          {t('auth.setNewPassword')}
        </Button>
      </Stack>
    </form>
  );
};
