import { useQueryClient } from '@tanstack/react-query';
import { useMantineColorScheme } from '@mantine/core';
import i18n from '@/app/i18n';

import { userKeys, userApi, useAuthStore } from '@/entities/user';
import { THEME_MAP } from '@/shared/constants/theme-map';

// Общая логика после получения accessToken
// Используется и при логине и при bootstrap
export const useApplyUserSession = () => {
  const queryClient = useQueryClient();
  const { authenticate } = useAuthStore();
  const { setColorScheme } = useMantineColorScheme();

  const applySession = async () => {
    const user = await userApi.getSelf();

    // 1. Кладём данные в React Query кеш
    queryClient.setQueryData(userKeys.self(), user);

    // 2. Обновляем auth state
    authenticate({ id: user.id, role: user.role });

    // 3. Применяем тему
    setColorScheme(THEME_MAP[user.theme] ?? 'auto');

    // 4. Применяем язык только если не установлен локально
    if (!localStorage.getItem('user-language')) {
      i18n.changeLanguage(user.language);
      localStorage.setItem('user-language', user.language);
    }

    return user;
  };

  return { applySession };
};
