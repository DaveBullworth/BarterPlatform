import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Stack, Title, Card, Group } from '@mantine/core';
import { LoginForm } from './components/LoginForm';
import { RegisterScreen } from './components/RegisterScreen';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import { ThemeSwitcher } from '@/shared/ui/ThemeSwitcher';

import styles from './AuthPage.module.scss';

type AuthMode = 'login' | 'register';

export const AuthPage = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <Container size={420} my="auto" className={styles.container}>
      <Stack gap="md" className={styles.stack}>
        <Card withBorder radius="md" p="lg" className={styles.card}>
          <Title order={3} ta="center" mb="md">
            {mode === 'login' ? t('auth.signin') : t('auth.registration')}
          </Title>

          {mode === 'login' ? (
            <LoginForm onRegister={() => setMode('register')} />
          ) : (
            <RegisterScreen onBackToLogin={() => setMode('login')} />
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
