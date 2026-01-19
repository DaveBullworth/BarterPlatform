import { useState, useEffect } from 'react';
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Group,
  Anchor,
  Stack,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { notify } from '@/shared/utils/notifications';
import { SupportPopover } from './SupportPopover';
import { useTheme } from '@/shared/hooks/useTheme';
import { loginUser } from '@/http/user';
import { bootstrapUser } from '@/shared/utils/bootstrapUser';
import { handleApiError } from '@/shared/utils/handleApiError';
import type { AppDispatch } from '@/store';
import type { ApiErrorData } from '@/types/error';

type LoginFormValues = {
  login: string;
  password: string;
  remember: boolean;
};

export const LoginForm = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { setColorScheme } = useTheme();
  const navigate = useNavigate();
  const [blockTimer, setBlockTimer] = useState(0); // оставшееся время блокировки кнопки

  const form = useForm<LoginFormValues>({
    initialValues: {
      login: '',
      password: '',
      remember: true,
    },
    validate: {
      login: (v) =>
        v.length < 8 ? t('auth.login') + ' ' + t('auth.enterValid') : null,
      password: (v) =>
        v.length < 8 ? t('auth.password') + ' ' + t('auth.enterValid') : null,
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      const { accessToken } = await loginUser({
        loginOrEmail: values.login,
        password: values.password,
        remember: values.remember,
      });

      localStorage.setItem('accessToken', accessToken);

      const result = await bootstrapUser({
        dispatch,
        setColorScheme,
        onRateLimit: () => {
          setBlockTimer(10); // блок на 10 секунд

          notify({
            title: t('auth.rateLimitTitle'),
            message: t('auth.rateLimitMessage', { seconds: 10 }),
            color: 'yellow',
            position: 'bottom-right',
            loading: true,
          });
        },
      });

      if (result !== 'RATE_LIMIT') navigate('/');
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorData>;

      // Проверяем, что это ошибка с ответом от сервера
      if (axiosError.response?.data) {
        const data = axiosError.response.data;

        // Блокируем кнопку только для LOGIN_RATE_LIMIT
        if (data.code === 'LOGIN_RATE_LIMIT') {
          const isBruteforce = data.meta?.isBruteforce ?? false;

          // Таймер в секундах: 10 для обычного rate-limit, 15 минут для brute-force
          const seconds = isBruteforce ? 15 * 60 : 10;
          setBlockTimer(seconds);
        }
      }

      // Показываем уведомление в любом случае
      handleApiError(err, t, { defaultMessage: t('auth.loginFailed') });
    }
  };

  // Таймер обратного отсчета
  useEffect(() => {
    if (blockTimer <= 0) return;

    const interval = setInterval(() => {
      setBlockTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [blockTimer]);

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="sm">
        <TextInput
          label={t('auth.login')}
          placeholder={t('auth.loginPlaceholder')}
          required
          {...form.getInputProps('login')}
        />

        <PasswordInput
          label={t('auth.password')}
          placeholder={t('auth.passwordPlaceholder')}
          required
          {...form.getInputProps('password')}
        />

        <Group justify="space-between">
          <Checkbox
            label={t('auth.remember')}
            {...form.getInputProps('remember', { type: 'checkbox' })}
          />

          <Anchor size="sm" component="button" type="button">
            {t('auth.forgot')}
          </Anchor>
        </Group>

        <Button fullWidth type="submit" disabled={blockTimer > 0}>
          {blockTimer > 0
            ? `${t('auth.submit')} (${blockTimer})`
            : t('auth.submit')}
        </Button>

        <Divider label={t('auth.or')} labelPosition="center" />

        <Group justify="space-between">
          <SupportPopover />

          <Anchor size="sm" component="button" type="button">
            {t('auth.register')}
          </Anchor>
        </Group>
      </Stack>
    </form>
  );
};
