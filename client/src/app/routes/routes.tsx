import { Navigate, type RouteObject } from 'react-router-dom';
import { RequireAuth } from './guards/RequireAuth';
import { RequireAdmin } from './guards/RequireAdmin';
import { AuthorizedPage } from '@/pages/placeholder/AuthorizedPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { AuthPage } from '@/pages/auth/AuthPage';
import { MailConfirmPage } from '@/pages/mail-confirm/MailConfirmPage';
import { ResetPasswordPage } from '@/pages/reset-password/ResetPasswordPage';
import { MainLayout } from '../layout/MainLayout';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // Главная страница приложения (гость + пользователь)
      { index: true, element: <AuthorizedPage /> },

      // Личный кабинет (только авторизованный)
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },

      // Админка
      {
        path: 'admin',
        element: (
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        ),
      },
    ],
  },

  // ===== Страницы вне основной части приложения =====
  { path: '/auth', element: <AuthPage /> },
  { path: '/mail-confirm', element: <MailConfirmPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // fallback при ошибочном маршруте
  { path: '*', element: <Navigate to="/" /> },
];
