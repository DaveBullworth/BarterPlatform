import type { PropsWithChildren } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { FullPageLoader } from '@/shared/ui/FullPageLoader';

export const AuthBootstrap = ({ children }: PropsWithChildren) => {
  const { loading, loadingReason, retryIn } = useAuth();

  if (loading) {
    return <FullPageLoader reason={loadingReason} retryIn={retryIn} />;
  }

  return children;
};
