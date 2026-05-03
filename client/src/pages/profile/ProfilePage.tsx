import { Title, Stack, Loader, Center, Button } from '@mantine/core';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  useAuthStore,
  useSelfUser,
  useUserById,
  isSelfUser,
  isAdminUser,
  resolveProfileMode,
  type AnyUser,
  type SelfUser,
  type AdminUser,
} from '@/entities/user';
import { USER_ROLES } from '@/shared/constants/user-role';
import { ProfileHeaderBlock } from '@/features/profile/header';
import { ProfileContactsBlock } from '@/features/profile/contacts';
import { ProfilePreferencesBlock } from '@/features/profile/preferences';
import { ProfileEditModal } from '@/features/profile/edit';
import { AccountDeactivationModal } from '@/features/profile/deactivation';

export const ProfilePage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();

  const mode = resolveProfileMode({
    viewedId: id,
    currentUserId: currentUser?.id,
    currentUserRole: currentUser?.role,
  });

  // Выбираем нужный query в зависимости от mode
  const selfQuery = useSelfUser();
  const otherQuery = useUserById(mode !== 'self' ? id : undefined);

  const query = mode === 'self' ? selfQuery : otherQuery;
  const user = query.data as AnyUser | undefined;

  const [editOpened, setEditOpened] = useState(false);
  const [deactivationOpened, setDeactivationOpened] = useState(false);

  if (query.isLoading) {
    return (
      <Center w="100%">
        <Loader />
      </Center>
    );
  }

  if (!user) return null;

  const canEdit = mode === 'self' || mode === 'admin';
  const canDeactivate =
    currentUser?.role === USER_ROLES.USER && mode === 'self';

  return (
    <Stack gap="lg" maw={860} w="100%" mx="auto">
      <Title order={2}>{t('profile.title')}</Title>

      <ProfileHeaderBlock user={user} mode={mode} />
      <ProfileContactsBlock user={user} role={currentUser?.role} mode={mode} />

      {mode === 'self' && isSelfUser(user) && (
        <ProfilePreferencesBlock user={user} />
      )}

      {canEdit && (isSelfUser(user) || isAdminUser(user)) && (
        <Button onClick={() => setEditOpened(true)} maw="100%">
          {t('profile.editData')}
        </Button>
      )}

      {canDeactivate && (
        <Button
          color="red"
          onClick={() => setDeactivationOpened(true)}
          maw={600}
        >
          {t('deactivation.deactivate')}
        </Button>
      )}

      {canEdit && (isSelfUser(user) || isAdminUser(user)) && (
        <ProfileEditModal
          user={user as SelfUser | AdminUser}
          role={currentUser?.role}
          opened={editOpened}
          onClose={() => setEditOpened(false)}
          onUpdated={() => setEditOpened(false)}
        />
      )}

      <AccountDeactivationModal
        opened={deactivationOpened}
        onClose={() => setDeactivationOpened(false)}
      />
    </Stack>
  );
};
