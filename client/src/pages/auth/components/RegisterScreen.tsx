import { useState, lazy, useCallback, useEffect, Suspense } from 'react';
import { Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';
import type { Country } from '@/types/country';
import type { ApiErrorData } from '@/types/error';
import { notify } from '@/shared/utils/notifications';
import { registerUser } from '@/http/user';
import { handleApiError } from '@/shared/utils/handleApiError';
import { CountrySelectPlaceholder } from './СountrySelectPlaceholder';
import { RegisterForm } from './RegisterForm';

const CountrySelectLazy = lazy(() => import('./CountrySelect'));

type RegisterFormValues = {
  email: string;
  login: string;
  name: string;
  password: string;
  phone?: string;
  agree: boolean;
};

type Props = {
  onBackToLogin: () => void;
};

export const RegisterScreen = ({ onBackToLogin }: Props) => {
  const { t } = useTranslation();

  // Отдельный стейт, чтобы заменить заглушку на реальный компонент
  const [loadCountrySelect, setLoadCountrySelect] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [blockTimer, setBlockTimer] = useState(0);

  useEffect(() => {
    // Подгружаем CountrySelect после первого рендера формы
    const timer = setTimeout(() => setLoadCountrySelect(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleCountryChange = useCallback((country: Country | null) => {
    setSelectedCountry(country);
  }, []);

  const handleSubmit = useCallback(
    async (values: RegisterFormValues) => {
      if (!selectedCountry) {
        notify({
          message: t('auth.countryNotSelected'),
          color: 'red',
        });
        return;
      }

      try {
        await registerUser({
          email: values.email,
          login: values.login,
          name: values.name,
          password: values.password,
          countryId: selectedCountry.id,
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
    [selectedCountry, t, onBackToLogin],
  );

  return (
    <Stack gap="sm">
      {loadCountrySelect ? (
        <Suspense fallback={<CountrySelectPlaceholder />}>
          {' '}
          <CountrySelectLazy
            value={selectedCountry?.id ?? null}
            onChange={handleCountryChange}
          />{' '}
        </Suspense>
      ) : (
        <CountrySelectPlaceholder />
      )}

      <RegisterForm
        onBackToLogin={onBackToLogin}
        onSubmit={handleSubmit}
        blockTimer={blockTimer}
        selectedCountry={selectedCountry}
      />
    </Stack>
  );
};
