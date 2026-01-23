import { useState } from 'react';
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { Button, PasswordInput, Stack, Title, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';

import { confirmPasswordReset } from '@/http/password.reset';
import { notify } from '@/shared/utils/notifications';
import { handleApiError } from '@/shared/utils/handleApiError';
import { createLengthValidator } from '@/shared/utils/validators';
import type { ApiErrorData } from '@/types/error';

type ResetPasswordFormValues = {
  password: string;
  passwordRepeat: string;
};

export const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    initialValues: {
      password: '',
      passwordRepeat: '',
    },

    validate: {
      password: createLengthValidator(t, 'auth.password', {
        min: 8,
        max: 60,
      }),

      passwordRepeat: (value, values) =>
        value !== values.password ? t('validation.passwordsDoNotMatch') : null,
    },
  });

  // если токена нет — сразу уводим
  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    try {
      setLoading(true);

      await confirmPasswordReset({
        token,
        newPassword: values.password,
      });

      notify({
        title: t('auth.passwordResetSuccessTitle'),
        message: t('auth.passwordResetSuccessMessage'),
        color: 'green',
      });

      navigate('/auth', { replace: true });
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiErrorData>;
      // Проверяем, что это ошибка с ответом от сервера
      if (axiosError.response?.status) {
        const status = axiosError.response.status;
        // 400 — намеренно общий ответ (security)
        if (status === 400) {
          notify({
            title: t('auth.passwordResetErrorTitle'),
            message: t('auth.passwordResetErrorMessage'),
            color: 'red',
          });
        } else {
          // всё остальное — технические ошибки
          handleApiError(err, t, {
            defaultMessage: t('auth.passwordResetFailed'),
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Title order={2}>{t('auth.resetPassword')}</Title>

        <Text c="dimmed">{t('auth.resetPasswordDescription')}</Text>

        <PasswordInput
          label={t('auth.newPassword')}
          placeholder={t('auth.passwordPlaceholder')}
          {...form.getInputProps('password')}
        />

        <PasswordInput
          label={t('auth.repeatPassword')}
          placeholder={t('auth.repeatPassword')}
          {...form.getInputProps('passwordRepeat')}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        />

        <Button type="submit" loading={loading}>
          {t('auth.setNewPassword')}
        </Button>
      </Stack>
    </form>
  );
};
