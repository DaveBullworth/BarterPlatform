import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from './useTheme';
import { bootstrapUser } from '@/shared/utils/bootstrapUser';
import type { RootState, AppDispatch } from '@/store';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { setColorScheme } = useTheme();
  const user = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const runBootstrap = async () => {
      const result = await bootstrapUser({
        dispatch,
        setColorScheme,
        onRateLimit: () => {
          // остаёмся в loading, пробуем снова через 10 секунд
          timeoutId = setTimeout(runBootstrap, 10000);
        },
      });

      if (result !== 'RATE_LIMIT') setLoading(false);
    };

    runBootstrap();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [dispatch, setColorScheme]);

  return {
    isAuth: user.isAuthenticated,
    user,
    loading,
  };
};
