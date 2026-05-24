import { lazy, Suspense, type ReactElement } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';

import { RequireAuth } from './guards/RequireAuth';
import { RequireAdmin } from './guards/RequireAdmin';
import { AppShell } from '@/widgets/AppShell';
import { FullPageLoader } from '@/shared/ui';
import { registerPreloader } from '@/shared/lib/preload';
import { ROUTES } from '@/shared/constants/routes';

/* --- Page imports (вынесены в переменные для preload + lazy) --- */

const importFeedPage = () => import('@/pages/feed/FeedPage');
const importProfilePage = () => import('@/pages/profile/ProfilePage');
const importAdminPage = () => import('@/pages/admin/AdminPage');
const importAuthPage = () => import('@/pages/auth/AuthPage');
const importMailConfirmPage = () =>
  import('@/pages/mail-confirm/MailConfirmPage');
const importResetPasswordPage = () =>
  import('@/pages/reset-password/ResetPasswordPage');
const importLotFormPage = () => import('@/pages/lot-form/LotFormPage');
const importLotPage = () => import('@/pages/lot/LotPage');
const importMyLotsPage = () => import('@/pages/my-lots/MyLotsPage');

// Регистрируем preload-функции — нижние слои триггерят их по строковому ключу.
registerPreloader('feed', importFeedPage);
registerPreloader('profile', importProfilePage);
registerPreloader('admin', importAdminPage);
registerPreloader('auth', importAuthPage);
registerPreloader('mail-confirm', importMailConfirmPage);
registerPreloader('reset-password', importResetPasswordPage);
registerPreloader('lot-form', importLotFormPage);
registerPreloader('lot', importLotPage);
registerPreloader('my-lots', importMyLotsPage);

const FeedPage = lazy(() =>
  importFeedPage().then((m) => ({ default: m.FeedPage })),
);
const ProfilePage = lazy(() =>
  importProfilePage().then((m) => ({ default: m.ProfilePage })),
);
const AdminPage = lazy(() =>
  importAdminPage().then((m) => ({ default: m.AdminPage })),
);
const AuthPage = lazy(() =>
  importAuthPage().then((m) => ({ default: m.AuthPage })),
);
const MailConfirmPage = lazy(() =>
  importMailConfirmPage().then((m) => ({ default: m.MailConfirmPage })),
);
const ResetPasswordPage = lazy(() =>
  importResetPasswordPage().then((m) => ({ default: m.ResetPasswordPage })),
);
const LotFormPage = lazy(() =>
  importLotFormPage().then((m) => ({ default: m.LotFormPage })),
);
const LotPage = lazy(() =>
  importLotPage().then((m) => ({ default: m.LotPage })),
);
const MyLotsPage = lazy(() =>
  importMyLotsPage().then((m) => ({ default: m.MyLotsPage })),
);

/** Suspense-обёртка с лёгким fallback'ом для lazy-роутов. */
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
