import { Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthPage } from '../../pages/auth/AuthPage';
import { MailConfirmPage } from '../../pages/mail-confirm/MailConfirmPage';
import { ResetPasswordPage } from '../../pages/reset-password/ResetPasswordPage';

export const publicRoutes = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/auth', element: <AuthPage /> },
      { path: '*', element: <Navigate to="/auth" /> },
      { path: '/mail-confirm', element: <MailConfirmPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
];
