import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { FullPageLoader } from '@/shared/ui/FullPageLoader';

export const GlobalAppOverlay = () => {
  const { rateLimited, retryIn } = useSelector((state: RootState) => state.app);

  if (!rateLimited) return null;

  return <FullPageLoader reason="RATE_LIMIT" retryIn={retryIn} />;
};
