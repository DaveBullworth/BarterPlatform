import { useMemo } from 'react';
import {
  createBrowserRouter,
  RouterProvider as ReactRouterProvider,
} from 'react-router-dom';
import { routes } from '../routes/routes';

export const RouterProvider = () => {
  const router = useMemo(() => createBrowserRouter(routes), []);

  return <ReactRouterProvider router={router} />;
};
