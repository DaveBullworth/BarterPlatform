import type { PropsWithChildren } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { FullPageLoader } from '@/shared/ui/FullPageLoader';

export const AuthBootstrap: React.FC<PropsWithChildren> = ({ children }) => {
  const { loading, rateLimited } = useAuth();

  // пока bootstrapUser загружается
  if (loading || rateLimited) {
    return (
      <FullPageLoader
        reason={rateLimited ? 'RATE_LIMIT' : 'BOOTSTRAP'}
        retryIn={rateLimited ? 5 : 0}
      />
    );
  }

  // дальше рендерим UI, даже если пользователь не авторизован (гость)
  return <>{children}</>;
};
