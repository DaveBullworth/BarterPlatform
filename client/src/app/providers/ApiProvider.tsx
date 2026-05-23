import { useEffect, type PropsWithChildren } from 'react';
import { useDispatch } from 'react-redux';

import { configureApiClient } from '@/shared/api/client';
import { rateLimitHit } from '@/entities/rate-limit';
import { loggedOut } from '@/entities/user';

export const ApiProvider = ({ children }: PropsWithChildren) => {
  const dispatch = useDispatch();

  useEffect(() => {
    configureApiClient({
      onRateLimit: (retryAfter) => dispatch(rateLimitHit(retryAfter)),
      onLogout: () => dispatch(loggedOut()),
    });
  }, [dispatch]);

  return <>{children}</>;
};
