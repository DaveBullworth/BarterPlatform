import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PASSWORD_RESET_REQUEST } from '@/shared/constants/password-reset-request';
import { notify, handleApiError } from '@/shared/lib';
import { userApi } from '@/entities/user';

type UseForgotPasswordOptions = {
  onSuccess?: () => void;
};

export const useForgotPassword = ({
  onSuccess,
}: UseForgotPasswordOptions = {}) => {
  const { t } = useTranslation();

  const { mutate, isPending } = useMutation({
    mutationFn: (email: string) => userApi.requestPasswordReset(email),
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
