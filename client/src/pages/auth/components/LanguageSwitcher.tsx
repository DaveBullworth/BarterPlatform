import { Select } from '@mantine/core';
import i18n from '@/shared/i18n';
import { USER_LANGUAGES } from '@/shared/constants/user-language.ts';

export const LanguageSwitcher = () => {
  const changeLanguage = (value: string | null) => {
    if (!value) return;
    i18n.changeLanguage(value);
    localStorage.setItem('user-language', value);
  };

  return (
    <Select
      size="xs"
      value={i18n.language}
      onChange={changeLanguage}
      data={[
        { value: USER_LANGUAGES.EN, label: 'EN' },
        { value: USER_LANGUAGES.PL, label: 'PL' },
        { value: USER_LANGUAGES.RU, label: 'RU' },
        { value: USER_LANGUAGES.DE, label: 'DE' },
      ]}
    />
  );
};
