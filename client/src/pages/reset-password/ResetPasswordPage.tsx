import { Navigate } from 'react-router-dom';
import { Center, Paper, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { ResetPasswordForm } from '@/features/auth/reset-password';
import { useResetPassword } from '@/features/auth/reset-password';
import { ROUTES } from '@/shared/constants/routes';

export const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const { hasToken } = useResetPassword();

  if (!hasToken) {
    return <Navigate to={ROUTES.AUTH} replace />;
  }

  return (
    <Center mih="100vh" px={{ base: 'sm', xs: 'md', sm: 'xl' }}>
      <Paper
        withBorder
        radius="md"
        shadow="sm"
        p={{ base: 'sm', xs: 'md', sm: 'xl' }}
        w="100%"
        maw={420}
      >
        <Title order={2} mb="md">
          {t('auth.resetPassword')}
        </Title>
        <ResetPasswordForm />
      </Paper>
    </Center>
  );
};
