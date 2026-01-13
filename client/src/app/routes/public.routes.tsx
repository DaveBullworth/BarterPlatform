import { Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthPage } from '../../pages/auth/AuthPage';

export const publicRoutes = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/auth', element: <AuthPage /> },
      { path: '*', element: <Navigate to="/auth" /> },
    ],
  },
];
