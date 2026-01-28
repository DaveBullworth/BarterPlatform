import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from './useTheme';
import { bootstrapUser } from '@/shared/utils/bootstrapUser';
import type { RootState, AppDispatch } from '@/store';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { setColorScheme } = useTheme();
  const setColorSchemeRef = useRef(setColorScheme);
  const user = useSelector((state: RootState) => state.user);

  const [loading, setLoading] = useState(true); // загружается bootstrapUser
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout>;

    const runBootstrap = async () => {
      setLoading(true);
      setRateLimited(false);

      const result = await bootstrapUser({
        dispatch,
        setColorScheme: setColorSchemeRef.current,
      });

      if (result === 'RATE_LIMIT') {
        setRateLimited(true);
        retryTimeout = setTimeout(runBootstrap, 5000);
        return; // оставляем loading = true, UI показывает FullPageLoader
      }

      setRateLimited(false);
      setLoading(false); // bootstrap завершён
    };

    runBootstrap();

    return () => clearTimeout(retryTimeout);
  }, [dispatch]);

  return {
    isAuth: user.isAuthenticated, // авторизован или нет
    user,
    loading, // true пока идёт bootstrapUser
    rateLimited,
  };
};
