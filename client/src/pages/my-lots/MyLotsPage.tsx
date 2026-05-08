import { Stack } from '@mantine/core';
import { LotsFeed } from '@/widgets/LotsFeed';

export const MyLotsPage = () => (
  <Stack gap="md" w={'100%'}>
    <LotsFeed selfOnly />
  </Stack>
);
