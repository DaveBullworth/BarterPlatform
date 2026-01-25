import { Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { USER_LANGUAGES } from '@/shared/constants/user-language.ts';

import '@/app/styles/globals.scss';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const changeLanguage = (value: string | null) => {
    if (!value) return;
    i18n.changeLanguage(value);
    localStorage.setItem('user-language', value);
  };

  return (
    <Select
      size="xs"
      w="5rem"
      checkIconPosition="right"
      value={i18n.language}
      onChange={changeLanguage}
      leftSectionPointerEvents="none"
      leftSection={<Languages size={16} />}
      data={[
        { value: USER_LANGUAGES.EN, label: 'EN' },
        { value: USER_LANGUAGES.PL, label: 'PL' },
        { value: USER_LANGUAGES.RU, label: 'RU' },
        { value: USER_LANGUAGES.DE, label: 'DE' },
      ]}
    />
  );
};
