import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  useNavigation,
  notify,
  createMutationErrorHandler,
} from '@/shared/lib';
import { userApi } from '@/entities/user';

export const useResetPassword = () => {
  const { t } = useTranslation();
  const { toAuth } = useNavigation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { mutate, isPending } = useMutation({
    mutationFn: async (dto: { password: string }) => {
      if (!token) throw new Error('Token missing');
      return userApi.confirmPasswordReset(token, dto.password);
    },
    onSuccess: () => {
      notify({
        title: t('auth.passwordResetSuccessTitle'),
        message: t('auth.passwordResetSuccessMessage'),
        color: 'green',
      });
      toAuth(true);
    },
    onError: createMutationErrorHandler(t, {
      badRequestTitle: t('auth.passwordResetErrorTitle'),
      badRequestMessage: t('auth.passwordResetErrorMessage'),
      defaultMessage: t('auth.passwordResetFailed'),
    }),
  });

  return {
    submit: mutate,
    isPending,
    hasToken: Boolean(token),
  };
};
