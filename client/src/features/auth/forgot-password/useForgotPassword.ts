import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { $host } from '@/shared/api';
import { notify } from '@/shared/lib';
import {
  PASSWORD_RESET_REQUEST,
  type PasswordResetRequest,
} from '@/shared/constants/password-reset-request';
import { handleApiError } from '@/shared/lib/errorHandler';

// DTO для ответа
interface PasswordResetRequestResponseDto {
  result: PasswordResetRequest;
  waitHours?: number;
}

type UseForgotPasswordOptions = {
  onSuccess?: () => void;
};

export const useForgotPassword = ({
  onSuccess,
}: UseForgotPasswordOptions = {}) => {
  const { t } = useTranslation();

  const { mutate, isPending } = useMutation({
    mutationFn: async (email: string) => {
      const { data } = await $host.post<PasswordResetRequestResponseDto>(
        '/password-reset/request',
        { email },
      );
      return data;
    },
    onSuccess: (data) => {
      if (data.result === PASSWORD_RESET_REQUEST.SENT) {
        notify({ message: t('auth.passwordResetSent'), color: 'green' });
      } else if (data.result === PASSWORD_RESET_REQUEST.ALREADY_REQESTED) {
        notify({
          message: t('auth.passwordResetAlreadyRequested', {
            hours: data.waitHours?.toFixed(1),
          }),
          color: 'yellow',
          autoClose: false,
        });
      }
      onSuccess?.();
    },
    onError: (error) => {
      handleApiError(error, t);
    },
  });

  return {
    submit: mutate,
    isLoading: isPending,
  };
};
