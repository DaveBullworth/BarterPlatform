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
import { useTranslation } from 'react-i18next';
import { AtSign, LockKeyhole } from 'lucide-react';
import type { AxiosError } from 'axios';

import { notify } from '@/shared/utils/notifications';
import { SupportPopover } from './SupportPopover';
import { ForgotPasswordModal } from '../../../shared/ui/ForgotPasswordModal';
import { useTheme } from '@/shared/hooks/useTheme';
import { loginUser } from '@/http/user';
import { bootstrapUser } from '@/shared/utils/bootstrapUser';
import { handleApiError } from '@/shared/utils/handleApiError';
import { createLengthValidator } from '@/shared/utils/validators';
import { ERROR_TYPES } from '@/shared/constants/error-types';
import type { AppDispatch } from '@/store';
import type { ApiErrorData } from '@/types/error';
import type { BootstrapResult } from '@/types/common';
import { goToRoot } from '@/shared/utils/navigation';

type LoginFormProps = {
  onRegister: () => void;
};

type LoginFormValues = {
  login: string;
  password: string;
  remember: boolean;
};

export const LoginForm = ({ onRegister }: LoginFormProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { setColorScheme } = useTheme();
  const navigate = useNavigate();
  const [blockTimer, setBlockTimer] = useState(0); // оставшееся время блокировки кнопки
  const [forgotOpened, setForgotOpened] = useState(false);

  const form = useForm<LoginFormValues>({
    initialValues: {
      login: '',
      password: '',
      remember: true,
    },
    validate: {
      login: createLengthValidator(t, 'auth.login', {
        min: 8,
        max: 60,
      }),
      password: createLengthValidator(t, 'auth.password', {
        min: 8,
        max: 60,
      }),
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

      const result: BootstrapResult = await bootstrapUser({
        dispatch,
        setColorScheme,
        onRateLimit: () => {
          setBlockTimer(10); // блок на 10 секунд

          notify({
            title: t('auth.rateLimitTitle'),
            message: t('auth.rateLimitMessage', { seconds: 5 }),
            color: 'yellow',
            position: 'bottom-right',
            loading: true,
          });
        },
      });

      if (result !== 'RATE_LIMIT') goToRoot(navigate);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorData>;

      // Проверяем, что это ошибка с ответом от сервера
      if (axiosError.response?.data) {
        const data = axiosError.response.data;

        // Блокируем кнопку только для LOGIN_RATE_LIMIT
        if (data.code === ERROR_TYPES.LOGIN_RATE_LIMIT) {
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
    <>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            variant="underline"
            label={t('auth.loginOrEmail')}
            leftSection={<AtSign size={16} />}
            placeholder={t('auth.loginOrEmailPlaceholder')}
            required
            {...form.getInputProps('login')}
          />

          <PasswordInput
            variant="underline"
            label={t('auth.password')}
            leftSection={<LockKeyhole size={16} />}
            placeholder={t('auth.passwordPlaceholder')}
            required
            {...form.getInputProps('password')}
          />

          <Group justify="space-between">
            <Checkbox
              label={t('auth.remember')}
              {...form.getInputProps('remember', { type: 'checkbox' })}
            />

            <Anchor
              size="sm"
              component="button"
              type="button"
              onClick={() => setForgotOpened(true)}
            >
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

            <Anchor
              size="sm"
              component="button"
              type="button"
              onClick={onRegister}
            >
              {t('auth.register')}
            </Anchor>
          </Group>
        </Stack>
      </form>
      <ForgotPasswordModal
        opened={forgotOpened}
        onClose={() => setForgotOpened(false)}
      />
    </>
  );
};
