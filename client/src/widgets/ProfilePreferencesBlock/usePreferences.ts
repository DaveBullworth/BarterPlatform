import { useTranslation } from 'react-i18next';
import { useMantineColorScheme } from '@mantine/core';

import {
  useUpdateSelfUser,
  type SelfUser,
  type UpdateSelfUserDto,
} from '@/entities/user';
import { USER_THEMES, type UserTheme } from '@/shared/constants/user-theme';

const colorSchemeToTheme = (colorScheme: string): UserTheme => {
  if (colorScheme === 'light') return USER_THEMES.LIGHT;
  if (colorScheme === 'dark') return USER_THEMES.DARK;
  return USER_THEMES.SYSTEM;
};

const normalizeLanguage = (lang: string): UpdateSelfUserDto['language'] => {
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('pl')) return 'pl';
  if (lang.startsWith('ru')) return 'ru';
  if (lang.startsWith('de')) return 'de';

  return 'en'; // fallback
};

export const usePreferences = (user: SelfUser) => {
  const { i18n } = useTranslation();
  const { colorScheme } = useMantineColorScheme();

  const localLanguage = normalizeLanguage(i18n.language);
  const localTheme = colorSchemeToTheme(colorScheme);

  const isLanguageOutdated = localLanguage !== user.language;
  const isThemeOutdated = localTheme !== user.theme;
  const hasOutdated = isLanguageOutdated || isThemeOutdated;

  const updateMutation = useUpdateSelfUser();

  const save = () => {
    const payload: UpdateSelfUserDto = {};
    if (isLanguageOutdated) payload.language = localLanguage;
    if (isThemeOutdated) payload.theme = localTheme;

    updateMutation.mutate(payload);
  };

  return {
    localLanguage,
    localTheme,
    isLanguageOutdated,
    isThemeOutdated,
    hasOutdated,
    save,
    isPending: updateMutation.isPending,
    isSuccess: updateMutation.isSuccess,
    reset: updateMutation.reset,
  };
};
