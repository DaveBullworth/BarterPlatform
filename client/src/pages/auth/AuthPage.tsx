import { useTranslation } from 'react-i18next';
import { Container, Stack, Title, Card } from '@mantine/core';
import { LoginForm } from './components/LoginForm';
import { LanguageSwitcher } from './components/LanguageSwitcher';

export const AuthPage = () => {
  const { t } = useTranslation();

  return (
    <Container size={420} my="auto">
      <Stack gap="md">
        <LanguageSwitcher />

        <Card withBorder radius="md" p="lg">
          <Title order={3} ta="center" mb="md">
            {t('auth.signin')}
          </Title>

          <LoginForm />
        </Card>
      </Stack>
    </Container>
  );
};
