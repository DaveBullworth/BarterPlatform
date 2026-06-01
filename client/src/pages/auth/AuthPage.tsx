import { useState } from 'react';
import { Container, Stack, Title, Card, Group, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ArrowLeftRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LoginForm } from '@/features/auth/login';
import { RegisterForm } from '@/features/auth/register';
import { LanguageSwitcher, ThemeSwitcher } from '@/shared/ui';

import styles from './AuthPage.module.scss';

type AuthMode = 'login' | 'register';

export const AuthPage = () => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className={styles.authShell}>
      <Container size={440} w="100%" px={isMobile ? 0 : `md`}>
        <Stack gap="md">
          <div className={styles.brand}>
            <span className={styles.brandMark}>
              <ArrowLeftRight size={22} strokeWidth={2.4} />
            </span>
            <Text component="span" className={styles.brandName}>
              {t('header.title')}
            </Text>
          </div>

          <Card
            className={styles.card}
            radius="lg"
            p={isMobile ? `md` : `xl`}
            withBorder
            bg="var(--mantine-color-body)"
          >
            <Title order={3} ta="center" mb="lg">
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
    </div>
  );
};
