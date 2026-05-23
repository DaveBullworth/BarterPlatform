import { lazy, Suspense, type ReactElement } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';

import { RequireAuth } from './guards/RequireAuth';
import { RequireAdmin } from './guards/RequireAdmin';
import { AppShell } from '@/widgets/AppShell';
import { FullPageLoader } from '@/shared/ui';
import { ROUTES } from '@/shared/constants/routes';

const FeedPage = lazy(() =>
  import('@/pages/feed/FeedPage').then((m) => ({ default: m.FeedPage })),
);
const ProfilePage = lazy(() =>
  import('@/pages/profile/ProfilePage').then((m) => ({
    default: m.ProfilePage,
  })),
);
const AdminPage = lazy(() =>
  import('@/pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })),
);
const AuthPage = lazy(() =>
  import('@/pages/auth/AuthPage').then((m) => ({ default: m.AuthPage })),
);
const MailConfirmPage = lazy(() =>
  import('@/pages/mail-confirm/MailConfirmPage').then((m) => ({
    default: m.MailConfirmPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/reset-password/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const LotFormPage = lazy(() =>
  import('@/pages/lot-form/LotFormPage').then((m) => ({
    default: m.LotFormPage,
  })),
);
const LotPage = lazy(() =>
  import('@/pages/lot/LotPage').then((m) => ({ default: m.LotPage })),
);
const MyLotsPage = lazy(() =>
  import('@/pages/my-lots/MyLotsPage').then((m) => ({
    default: m.MyLotsPage,
  })),
);

/** Suspense-обёртка с fallback'ом для lazy-роутов. */
const withSuspense = (node: ReactElement): ReactElement => (
  <Suspense fallback={<FullPageLoader />}>{node}</Suspense>
);

export const routes: RouteObject[] = [
  {
    path: ROUTES.ROOT,
    element: <AppShell />,
    children: [
      { index: true, element: withSuspense(<FeedPage />) },

      {
        path: ROUTES.PROFILE,
        element: withSuspense(
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>,
        ),
      },

      {
        path: ROUTES.ADMIN,
        element: withSuspense(
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>,
        ),
      },

      {
        path: `${ROUTES.USERS}/:id`,
        element: withSuspense(
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>,
        ),
      },

      {
        path: ROUTES.LOT_CREATE,
        element: withSuspense(
          <RequireAuth>
            <LotFormPage key="create" />
          </RequireAuth>,
        ),
      },

      {
        path: `${ROUTES.LOT_EDIT}/:id`,
        element: withSuspense(
          <RequireAuth>
            <LotFormPage key="edit" />
          </RequireAuth>,
        ),
      },

      {
        path: `${ROUTES.LOT_VIEW}/:id`,
        element: withSuspense(<LotPage />),
      },

      {
        path: ROUTES.MY_LOTS,
        element: withSuspense(
          <RequireAuth>
            <MyLotsPage />
          </RequireAuth>,
        ),
      },
    ],
  },

  { path: ROUTES.AUTH, element: withSuspense(<AuthPage />) },
  { path: ROUTES.MAIL_CONFIRM, element: withSuspense(<MailConfirmPage />) },
  { path: ROUTES.RESET_PASSWORD, element: withSuspense(<ResetPasswordPage />) },

  { path: '*', element: <Navigate to={ROUTES.ROOT} /> },
];
