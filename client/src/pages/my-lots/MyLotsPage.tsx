import { useState } from 'react';
import { Stack, Title, Text, Group } from '@mantine/core';
import { Boxes } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/entities/user';
import { USER_ROLES } from '@/shared/constants/user-role';
import { LotsFeed } from '@/widgets/LotsFeed';
import { AdminUserSelect } from '@/widgets/OffersFeed';

export const MyLotsPage = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;

  // ADMIN: лента лотов выбранного пользователя вместо своей.
  const [asUserId, setAsUserId] = useState<string | null>(null);

  return (
    <Stack gap="md" w="100%">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Group gap="sm" align="center">
          <Boxes
            size={28}
            strokeWidth={1.8}
            color="var(--mantine-color-barter-6)"
          />
          <Stack gap={2}>
            <Title order={2}>{t('nav.myLots')}</Title>
            <Text size="sm" c="dimmed">
              {t('myLots.description', {
                defaultValue: 'All lots you have published',
              })}
            </Text>
          </Stack>
        </Group>

        {isAdmin && (
          <AdminUserSelect value={asUserId} onChange={setAsUserId} />
        )}
      </Group>

      <LotsFeed selfOnly asUserId={isAdmin ? asUserId ?? undefined : undefined} />
    </Stack>
  );
};
