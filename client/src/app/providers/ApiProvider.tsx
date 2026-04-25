import { configureApiClient } from '@/shared/api/client';
import { useDispatch } from 'react-redux';
import { rateLimitHit } from '@/app/store/appSlice';
import { loggedOut } from '@/entities/user/store';
import { useEffect, type PropsWithChildren } from 'react';

export const ApiProvider = ({ children }: PropsWithChildren) => {
  const dispatch = useDispatch();

  useEffect(() => {
    configureApiClient({
      onRateLimit: (retryAfter) => dispatch(rateLimitHit(retryAfter)),
      onLogout: () => {
        localStorage.removeItem('accessToken');
        dispatch(loggedOut());
      },
    });
  }, [dispatch]);

  return <>{children}</>;
};
