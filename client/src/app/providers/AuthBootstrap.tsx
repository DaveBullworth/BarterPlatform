import type { PropsWithChildren } from 'react';
import { FullPageLoader } from '@/shared/ui';
import { useBootstrap } from '@/features/auth/bootstrap';
import { LOADING_REASON } from '@/shared/constants/loading-reason';

export const AuthBootstrap = ({ children }: PropsWithChildren) => {
  const { isLoading, rateLimited } = useBootstrap();

  if (rateLimited) {
    return <FullPageLoader reason={LOADING_REASON.RATE_LIMIT} retryIn={5} />;
  }

  if (isLoading) {
    return <FullPageLoader reason={LOADING_REASON.BOOTSTRAP} />;
  }

  return <>{children}</>;
};
