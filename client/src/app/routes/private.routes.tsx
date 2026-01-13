import { Navigate } from 'react-router-dom';
import { PrivateLayout } from '../layouts/PrivateLayout';
import { AuthorizedPage } from '../../pages/placeholder/AuthorizedPage';

export const privateRoutes = [
  {
    element: <PrivateLayout />,
    children: [
      { path: '/', element: <AuthorizedPage /> },
      { path: '*', element: <Navigate to="/" /> },
    ],
  },
];
