import { Title, Text, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export const AdminPage = () => {
  const { t } = useTranslation();

  return (
    <Stack>
      <Title order={2}>{t('admin.title')}</Title>
      <Text c="dimmed">{t('admin.stub')}</Text>
    </Stack>
  );
};
