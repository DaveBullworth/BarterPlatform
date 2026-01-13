import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import i18n from '@/shared/i18n';
import { getSelfUser } from '@/http/user';
import { useTheme } from './useTheme';
import { setUser, logout } from '@/store/userSlice';
import { USER_THEMES } from '@/shared/constants/user-theme';
import type { RootState, AppDispatch } from '@/store';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { setColorScheme } = useTheme();
  const user = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const selfUser = await getSelfUser();

        // явно маппим DTO → состояние auth
        dispatch(
          setUser({
            id: selfUser.id,
            login: selfUser.login,
            role: selfUser.role,
          }),
        );

        // язык
        const storedLang = localStorage.getItem('user-language');

        if (!storedLang) {
          i18n.changeLanguage(selfUser.language);
          localStorage.setItem('user-language', selfUser.language);
        }

        // Тема Mantine
        if (
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
            case 'system': // system → auto для Mantine
            default:
              mantineTheme = 'auto';
              break;
          }

          setColorScheme(mantineTheme);
        }
      } catch (err) {
        console.error('Auth bootstrap failed', err);
        dispatch(logout());
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [dispatch, setColorScheme]);

  return {
    isAuth: user.isAuthenticated,
    user,
    loading,
  };
};
