import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import { userApi } from '@/entities/user';
import { notify, handleApiError } from '@/shared/lib';

export type RegisterDto = {
  email: string;
  login: string;
  name: string;
  password: string;
  phone: string;
  regionId: string;
  cityId: string;
  districtId: string;
};

export const useRegister = (onSuccessCallback: () => void) => {
  const { t } = useTranslation();

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: RegisterDto) => {
      return userApi.register({
        email: values.email,
        login: values.login,
        name: values.name,
        password: values.password,
        ...(values.phone ? { phone: values.phone } : {}),
        regionId: Number(values.regionId),
        cityId: Number(values.cityId),
        ...(values.districtId ? { districtId: Number(values.districtId) } : {}),
      });
    },
    onSuccess: () => {
      notify({ message: t('auth.registrationSuccess'), color: 'green' });
      onSuccessCallback();
    },
    onError: (error) =>
      handleApiError(error, t, {
        defaultMessage: t('auth.registrationFailed'),
      }),
  });

  return {
    register: mutate,
    isPending,
  };
};
