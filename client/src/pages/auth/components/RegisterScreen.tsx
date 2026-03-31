import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';
import type { ApiErrorData } from '@/types/error';
import { notify } from '@/shared/utils/notifications';
import { registerUser } from '@/http/user';
import { handleApiError } from '@/shared/utils/handleApiError';
import { RegisterForm } from './RegisterForm';

type RegisterFormValues = {
  email: string;
  login: string;
  name: string;
  password: string;
  phone?: string;
  regionId: string;
  cityId: string;
  districtId: string;
  agree: boolean;
};

type Props = {
  onBackToLogin: () => void;
};

export const RegisterScreen = ({ onBackToLogin }: Props) => {
  const { t } = useTranslation();
  const [blockTimer, setBlockTimer] = useState(0);

  const handleSubmit = useCallback(
    async (values: RegisterFormValues) => {
      try {
        await registerUser({
          email: values.email,
          login: values.login,
          name: values.name,
          password: values.password,
          ...(values.phone ? { phone: values.phone } : {}),
          regionId: Number(values.regionId),
          cityId: Number(values.cityId),
          ...(values.districtId ? { districtId: Number(values.districtId) } : {}),
        });

        notify({
          message: t('auth.registrationSuccess'),
          color: 'green',
          position: 'bottom-right',
        });

        onBackToLogin();
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorData>;

        if (axiosError.response?.data?.code === 'LOGIN_RATE_LIMIT') {
          setBlockTimer(10);
        }

        handleApiError(err, t, {
          defaultMessage: t('auth.registrationFailed'),
        });
      }
    },
    [onBackToLogin, t],
  );

  return (
    <RegisterForm
      onBackToLogin={onBackToLogin}
      onSubmit={handleSubmit}
      blockTimer={blockTimer}
    />
  );
};
