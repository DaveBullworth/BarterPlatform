import React from 'react';
import type { AxiosError } from 'axios';
import { notify } from './notifications';
import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { AlertCircle } from 'lucide-react';
import type { ApiErrorData } from '@/types/error';

interface ApiErrorOptions {
  defaultMessage?: string | ReactNode; // если неизвестная ошибка
}

export const handleApiError = (
  error: unknown,
  t: TFunction,
  opts?: ApiErrorOptions,
) => {
  if (!error) return;

  let message: ReactNode = opts?.defaultMessage || 'Something went wrong';
  let color: 'blue' | 'red' | 'green' | 'yellow' | 'teal' | 'gray' = 'red';
  let icon: ReactNode = undefined;
  let loading = false;

  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError;

    if (axiosError.response?.data) {
      const data = axiosError.response.data as ApiErrorData;

      switch (data.code) {
        case 'INVALID_CREDENTIALS':
          message = t('auth.invalidCredentials');
          color = 'yellow';
          break;
        case 'EMAIL_NOT_CONFIRMED':
          message = t('auth.emailNotConfirmed');
          color = 'yellow';
          break;
        case 'MAX_SESSIONS_EXCEEDED':
          message = t('auth.maxSessionsExceeded', {
            max: data.meta?.maxSessions ?? '?',
          });
          color = 'yellow';
          break;
        case 'LOGIN_RATE_LIMIT':
          if (data.meta?.isBruteforce) {
            // Красное уведомление, долгий таймер
            message = t('auth.loginBruteforce');
            color = 'red';
            icon = React.createElement(AlertCircle, { size: 18 });
          } else {
            // Обычный rate-limit, короткий таймер (жёлтый)
            message = t('auth.loginRateLimit');
            color = 'yellow';
            loading = true;
          }
          break;
        default:
          message = data.message || message;
          color = 'red';
          icon = React.createElement(AlertCircle, { size: 18 });
          break;
      }
    } else {
      message = 'Сервер недоступен';
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  notify({
    message,
    color,
    icon,
    loading,
  });
};
