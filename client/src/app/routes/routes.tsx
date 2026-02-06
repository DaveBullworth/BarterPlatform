import { Navigate, type RouteObject } from 'react-router-dom';
import { RequireAuth } from './guards/RequireAuth';
import { RequireAdmin } from './guards/RequireAdmin';
import { AuthorizedPage } from '@/pages/placeholder/AuthorizedPage';
import { UserProfilePage } from '@/pages/profile/ProfilePage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { AuthPage } from '@/pages/auth/AuthPage';
import { MailConfirmPage } from '@/pages/mail-confirm/MailConfirmPage';
import { ResetPasswordPage } from '@/pages/reset-password/ResetPasswordPage';
import { MainLayout } from '../layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';

export const routes: RouteObject[] = [
  {
    path: ROUTES.ROOT,
    element: <MainLayout />,
    children: [
      // Главная страница приложения (гость + пользователь)
      { index: true, element: <AuthorizedPage /> },

      // Личный кабинет (только авторизованный)
      {
        path: ROUTES.PROFILE,
        element: (
          <RequireAuth>
            <UserProfilePage />
          </RequireAuth>
        ),
      },

      // Админка
      {
        path: ROUTES.ADMIN,
        element: (
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        ),
      },

      // Страницы пользователей
      {
        path: ROUTES.USERS + '/:id',
        element: (
          <RequireAuth>
            <UserProfilePage />
          </RequireAuth>
        ),
      },
    ],
  },

  // ===== Страницы вне основной части приложения =====
  { path: ROUTES.AUTH, element: <AuthPage /> },
  { path: ROUTES.MAIL_CONFIRM, element: <MailConfirmPage /> },
  { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },

  // fallback при ошибочном маршруте
  { path: '*', element: <Navigate to={ROUTES.ROOT} /> },
];
