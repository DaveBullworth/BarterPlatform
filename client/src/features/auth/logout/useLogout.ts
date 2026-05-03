import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useAuthStore, userApi } from '@/entities/user';
import { notify } from '@/shared/lib';

type UseLogoutOptions = {
  onSuccess?: () => void;
};

export const useLogout = ({ onSuccess }: UseLogoutOptions = {}) => {
  const { t } = useTranslation();
  const { logout } = useAuthStore();

  const { mutate, isPending } = useMutation({
    mutationFn: () => userApi.logout(),
    onSuccess: () => {
      logout();
      onSuccess?.();
    },
    onError: () => {
      // Даже при ошибке разлогиниваем локально
      logout();
      onSuccess?.();
      notify({
        message: t('common.logoutFailed'),
        color: 'red',
      });
    },
  });

  return {
    logout: mutate,
    isLoading: isPending,
  };
};
