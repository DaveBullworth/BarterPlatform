import { RouterProvider } from './RouterProvider';
import { AuthBootstrap } from './AuthBootstrap';

export const AppProviders = () => {
  return (
    <AuthBootstrap>
      <RouterProvider />
    </AuthBootstrap>
  );
};
