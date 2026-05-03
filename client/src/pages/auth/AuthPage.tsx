import { useState } from 'react';
import { Container, Stack, Title, Card, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { LoginForm } from '@/features/auth/login';
import { RegisterForm } from '@/features/auth/register';
import { LanguageSwitcher, ThemeSwitcher } from '@/shared/ui';

type AuthMode = 'login' | 'register';

export const AuthPage = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <Container
      size={420}
      my="auto"
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}
    >
      <Stack gap="md" w="100%">
        <Card withBorder radius="md" p="lg" bg="var(--mantine-color-body)">
          <Title order={3} ta="center" mb="md">
            {mode === 'login' ? t('auth.signin') : t('auth.registration')}
          </Title>

          {mode === 'login' ? (
            <LoginForm onRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onBackToLogin={() => setMode('login')} />
          )}
        </Card>

        <Group gap="sm" grow>
          <LanguageSwitcher />
          <ThemeSwitcher />
        </Group>
      </Stack>
    </Container>
  );
};
