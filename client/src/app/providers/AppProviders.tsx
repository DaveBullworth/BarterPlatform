import { RouterProvider } from './RouterProvider';
import { AuthBootstrap } from './AuthBootstrap';
import { GlobalAppOverlay } from './GlobalAppOverlay';

export const AppProviders = () => {
  return (
    <>
      <AuthBootstrap>
        <RouterProvider />
      </AuthBootstrap>
      <GlobalAppOverlay />
    </>
  );
};
