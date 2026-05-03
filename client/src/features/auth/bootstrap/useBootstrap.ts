import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/app/store';
import { rateLimitClear } from '@/app/store/appSlice';
import { useApplyUserSession } from './useApplyUserSession';
import { userKeys } from '@/entities/user';

const FALLBACK_RETRY_SECONDS = 5;

export const useBootstrap = () => {
  const { applySession } = useApplyUserSession();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { rateLimited, retryIn } = useSelector((s: RootState) => s.app);
  const hasToken = Boolean(localStorage.getItem('accessToken'));

  const { isLoading } = useQuery({
    queryKey: userKeys.self(),
    queryFn: applySession,
    enabled: hasToken && !rateLimited,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status && [401, 429].includes(status)) return false;
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // Единственный оправданный useEffect здесь —
  // перезапуск query после окончания rate limit
  useEffect(() => {
    if (!rateLimited) return;

    const seconds = retryIn ?? FALLBACK_RETRY_SECONDS;
    const timeout = setTimeout(() => {
      dispatch(rateLimitClear());
      // Инвалидируем чтобы query перезапустился когда enabled станет true
      void queryClient.invalidateQueries({ queryKey: userKeys.self() });
    }, seconds * 1000);

    return () => clearTimeout(timeout);
  }, [rateLimited, retryIn, dispatch, queryClient]);

  return {
    isLoading: hasToken && isLoading,
    rateLimited,
  };
};
