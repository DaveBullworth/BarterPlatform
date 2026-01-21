import { Autocomplete, Loader } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export const CountrySelectPlaceholder = () => {
  const { t } = useTranslation();

  return (
    <Autocomplete
      label={t('auth.country')}
      placeholder={t('auth.selectCountry')}
      data={[]}
      disabled
      rightSection={<Loader size="xs" />}
    />
  );
};
