import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from './useTheme';
import { bootstrapUser } from '@/shared/utils/bootstrapUser';
import type { RootState, AppDispatch } from '@/store';
import type { LoadingReason, BootstrapResult } from '@/types/common';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { setColorScheme } = useTheme();
  const setColorSchemeRef = useRef(setColorScheme);
  const user = useSelector((state: RootState) => state.user);

  const [loading, setLoading] = useState(true);
  const [loadingReason, setLoadingReason] =
    useState<LoadingReason>('BOOTSTRAP');
  const [retryIn, setRetryIn] = useState<number | null>(null);

  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout>;
    let countdownInterval: ReturnType<typeof setInterval>;

    const startCountdown = (seconds: number) => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }

      let remaining = seconds;

      setRetryIn(remaining);

      countdownInterval = setInterval(() => {
        remaining -= 1;

        if (remaining <= 0) {
          clearInterval(countdownInterval);
          setRetryIn(null);
          return;
        }

        setRetryIn(remaining);
      }, 1000);
    };

    const runBootstrap = async () => {
      setLoading(true);
      setLoadingReason('BOOTSTRAP');

      const result: BootstrapResult = await bootstrapUser({
        dispatch,
        setColorScheme: setColorSchemeRef.current,
      });

      if (result === 'RATE_LIMIT') {
        setLoadingReason('RATE_LIMIT');
        startCountdown(10);

        retryTimeout = setTimeout(runBootstrap, 10_000);
        return;
      }

      setLoading(false);
      setLoadingReason(null);
    };

    runBootstrap();

    return () => {
      clearTimeout(retryTimeout);
      clearInterval(countdownInterval);
    };
  }, [dispatch]);

  return {
    isAuth: user.isAuthenticated,
    user,
    loading,
    loadingReason,
    retryIn,
  };
};
