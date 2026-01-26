import React from 'react';
import type { AxiosError } from 'axios';
import { notify } from './notifications';
import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { AlertCircle, ClockAlert, DoorClosedLocked } from 'lucide-react';
import type { ApiErrorData } from '@/types/error';
import { ERROR_TYPES } from '../constants/error-types';
import { ResendConfirmEmailAction } from '../ui/ResendConfirmEmailAction';

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
  let autoClose: number | undefined = 5000;

  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError;

    if (axiosError.response?.data) {
      const data = axiosError.response.data as ApiErrorData;

      // Специально для `EMAIL_NOT_CONFIRMED`
      const loginOrEmail = data.meta?.loginOrEmail;

      switch (data.code) {
        /** AUTH */
        case ERROR_TYPES.INVALID_CREDENTIALS:
          message = t('auth.invalidCredentials');
          color = 'yellow';
          break;
        case ERROR_TYPES.EMAIL_NOT_CONFIRMED:
          if (loginOrEmail) {
            message = React.createElement(ResendConfirmEmailAction, {
              loginOrEmail,
            });
            autoClose = undefined;
          } else {
            message = t('auth.emailNotConfirmed');
          }
          color = 'yellow';
          break;
        case ERROR_TYPES.MAX_SESSIONS_EXCEEDED:
          message = t('auth.maxSessionsExceeded', {
            max: data.meta?.maxSessions ?? '?',
          });
          color = 'yellow';
          break;
        case ERROR_TYPES.LOGIN_RATE_LIMIT:
        case ERROR_TYPES.TOO_MANY_REQUESTS:
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

        /** REGISTRATION */
        case ERROR_TYPES.EMAIL_ALREADY_IN_USE:
          message = t('auth.emailAlreadyInUse');
          color = 'yellow';
          break;

        case ERROR_TYPES.LOGIN_ALREADY_IN_USE:
          message = t('auth.loginAlreadyInUse');
          color = 'yellow';
          break;

        case ERROR_TYPES.COUNTRY_NOT_FOUND:
          message = t('auth.countryNotFound');
          color = 'yellow';
          break;

        /** MAIL-RESEND */
        case ERROR_TYPES.EMAIL_ALREADY_CONFIRMED:
          message = t('auth.emailAlreadyConfirmed');
          color = 'yellow';
          break;

        case ERROR_TYPES.RESEND_CONFIRM_RATE_LIMIT:
          message = t('auth.resendRateLimit', {
            hours: data.meta?.waitHours?.toFixed(1),
          });
          color = 'yellow';
          break;

        case ERROR_TYPES.USER_NOT_FOUND:
          message = t('auth.userNotFound');
          color = 'red';
          break;

        /** PASSWORD-RESET */
        case ERROR_TYPES.PASSWORD_RESET_RATE_LIMIT:
          message = t('auth.passwordResetRateLimit');
          color = 'yellow';
          icon = React.createElement(ClockAlert, { size: 18 });
          break;

        /** LOGOUT */
        case ERROR_TYPES.REFRESH_TOKEN_MISSING:
          message = t('common.refreshTokenNotFound');
          color = 'red';
          icon = React.createElement(DoorClosedLocked, { size: 18 });
          break;

        case ERROR_TYPES.SESSION_NOT_FOUND:
          message = t('common.sessionNotFound');
          color = 'red';
          icon = React.createElement(DoorClosedLocked, { size: 18 });
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
    autoClose,
  });
};
