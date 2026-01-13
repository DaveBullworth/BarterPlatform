import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '../routes';

export const RouterProvider = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};
