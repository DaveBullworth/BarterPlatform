import { Navigate, type RouteObject } from 'react-router-dom';
import { RequireAuth } from './guards/RequireAuth';
import { RequireAdmin } from './guards/RequireAdmin';
import { AppShell } from '@/widgets/AppShell';
import { FeedPage } from '@/pages/feed/FeedPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { AuthPage } from '@/pages/auth/AuthPage';
import { MailConfirmPage } from '@/pages/mail-confirm/MailConfirmPage';
import { ResetPasswordPage } from '@/pages/reset-password/ResetPasswordPage';
import { LotFormPage } from '@/pages/lot-form/LotFormPage';
import { LotPage } from '@/pages/lot/LotPage';
import { ROUTES } from '@/shared/constants/routes';

export const routes: RouteObject[] = [
  {
    path: ROUTES.ROOT,
    element: <AppShell />,
    children: [
      { index: true, element: <FeedPage /> },

      {
        path: ROUTES.PROFILE,
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },

      {
        path: ROUTES.ADMIN,
        element: (
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        ),
      },

      {
        path: `${ROUTES.USERS}/:id`,
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },

      {
        path: ROUTES.LOT_CREATE,
        element: (
          <RequireAuth>
            <LotFormPage key="create" />
          </RequireAuth>
        ),
      },

      {
        path: `${ROUTES.LOT_EDIT}/:id`,
        element: (
          <RequireAuth>
            <LotFormPage key="edit" />
          </RequireAuth>
        ),
      },

      {
        path: `${ROUTES.LOT_VIEW}/:id`,
        element: <LotPage />,
      },
    ],
  },

  { path: ROUTES.AUTH, element: <AuthPage /> },
  { path: ROUTES.MAIL_CONFIRM, element: <MailConfirmPage /> },
  { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },

  { path: '*', element: <Navigate to={ROUTES.ROOT} /> },
];
