import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';

import { useNavigation } from '@/shared/lib/navigation';
import { handleApiError } from '@/shared/lib';
import { ERROR_TYPES } from '@/shared/constants/error-types';
import { useApplyUserSession } from '../bootstrap/useApplyUserSession';
import { ResendConfirmEmailAction } from '../resend-confirm/ResendConfirmEmailAction';
import { userApi } from '@/entities/user';
import type { ApiErrorData } from '@/shared/lib';

export type LoginDto = {
  login: string;
  password: string;
  remember: boolean;
};

export const useLogin = () => {
  const { t } = useTranslation();
  const { toRoot } = useNavigation();
  const { applySession } = useApplyUserSession();
  const [blockTimer, setBlockTimer] = useState(0);

  const { mutate, isPending } = useMutation({
    mutationFn: async (dto: LoginDto) => {
      const accessToken = await userApi.login({
        loginOrEmail: dto.login,
        password: dto.password,
        remember: dto.remember,
      });
      localStorage.setItem('accessToken', accessToken);
      // Переиспользуем общую логику
      return applySession();
    },
    onSuccess: () => {
      toRoot();
    },
    onError: (error: AxiosError<ApiErrorData>) => {
      const code = error.response?.data?.code;
      const meta = error.response?.data?.meta;

      if (code === ERROR_TYPES.LOGIN_RATE_LIMIT) {
        setBlockTimer(meta?.isBruteforce ? 15 * 60 : 10);
      }

      handleApiError(error, t, {
        defaultMessage: t('auth.loginFailed'),
        renderEmailNotConfirmed: (loginOrEmail) => (
          <ResendConfirmEmailAction loginOrEmail={loginOrEmail} />
        ),
      });
    },
  });

  // Таймер обратного отсчёта
  useEffect(() => {
    if (blockTimer <= 0) return;
    const interval = setInterval(() => setBlockTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [blockTimer]);

  return {
    login: mutate,
    isPending,
    blockTimer,
  };
};
