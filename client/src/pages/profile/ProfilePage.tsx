import { Title, Text, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export const ProfilePage = () => {
  const { t } = useTranslation();

  return (
    <Stack>
      <Title order={2}>{t('profile.title')}</Title>
      <Text c="dimmed">{t('profile.stub')}</Text>
    </Stack>
  );
};
