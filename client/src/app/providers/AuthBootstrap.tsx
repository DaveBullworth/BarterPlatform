import type { PropsWithChildren } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';

export const AuthBootstrap = ({ children }: PropsWithChildren) => {
  const { loading } = useAuth();

  if (loading) {
    return null; // или <FullPageLoader />
  }

  return children;
};
