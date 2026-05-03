import { AuthBootstrap } from './AuthBootstrap';
import { RouterProvider } from './RouterProvider';

export const AppProvider = () => (
  <AuthBootstrap>
    <RouterProvider />
  </AuthBootstrap>
);
