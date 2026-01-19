import { AxiosError } from 'axios';
import i18n from '@/shared/i18n';
import { getSelfUser } from '@/http/user';
import { USER_THEMES } from '@/shared/constants/user-theme';
import type { AppDispatch } from '@/store';
import { setUser, logout } from '@/store/userSlice';

interface BootstrapOptions {
  dispatch: AppDispatch;
  setColorScheme?: (theme: 'light' | 'dark' | 'auto') => void;
}

export const bootstrapUser = async ({
  dispatch,
  setColorScheme,
  onRateLimit,
}: BootstrapOptions & { onRateLimit?: () => void }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return 'NO_TOKEN';
  }

  try {
    const selfUser = await getSelfUser();

    // обновляем Redux
    dispatch(
      setUser({
        id: selfUser.id,
        login: selfUser.login,
        role: selfUser.role,
      }),
    );

    // проверка и установка языка
    const storedLang = localStorage.getItem('user-language');
    if (!storedLang) {
      i18n.changeLanguage(selfUser.language);
      localStorage.setItem('user-language', selfUser.language);
    }

    // проверка и установка темы
    if (
      setColorScheme &&
      selfUser.theme &&
      Object.values(USER_THEMES).includes(selfUser.theme)
    ) {
      let mantineTheme: 'light' | 'dark' | 'auto';
      switch (selfUser.theme) {
        case 'light':
          mantineTheme = 'light';
          break;
        case 'dark':
          mantineTheme = 'dark';
          break;
        case 'system':
        default:
          mantineTheme = 'auto';
          break;
      }
      setColorScheme(mantineTheme);
    }

    return 'OK';
  } catch (error: unknown) {
    // Проверяем, что это rate-limit тогда просто тихо выходим и ждём
    if (isAxiosError(error) && error.response?.status === 429) {
      console.warn('Rate limit hit during bootstrapUser');
      onRateLimit?.();
      return 'RATE_LIMIT';
    }

    console.error('Bootstrap user failed', error);
    dispatch(logout());
    return 'ERROR';
  }
};

// Type guard
function isAxiosError(err: unknown): err is AxiosError {
  return typeof err === 'object' && err !== null && 'isAxiosError' in err;
}
