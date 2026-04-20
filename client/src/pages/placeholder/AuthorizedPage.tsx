import { Stack } from '@mantine/core';
import { LotsFeed } from '@/shared/ui/LotsFeed';
// import { useTranslation } from 'react-i18next';

export const AuthorizedPage = () => {
  // const { t } = useTranslation();

  return (
    <Stack gap="md" w={'100%'}>
      <LotsFeed />
    </Stack>
  );
};
