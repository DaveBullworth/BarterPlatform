import { Stack, Loader, Center, Button, Tabs, Group } from '@mantine/core';
import { Contact, Settings, Pencil, UserX, ShieldAlert } from 'lucide-react';
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
import { ProfileHeaderBlock } from '@/widgets/ProfileHeaderBlock';
import { ProfileContactsBlock } from '@/widgets/ProfileContactsBlock';
import { ProfilePreferencesBlock } from '@/widgets/ProfilePreferencesBlock';
import { ProfileEditModal } from '@/features/profile/edit';
import { AccountDeactivationModal } from '@/features/profile/deactivation';

import styles from './ProfilePage.module.scss';

export const ProfilePage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();

  const mode = resolveProfileMode({
    viewedId: id,
    currentUserId: currentUser?.id,
    currentUserRole: currentUser?.role,
  });

  const selfQuery = useSelfUser();
  const otherQuery = useUserById(mode !== 'self' ? id : undefined);

  const query = mode === 'self' ? selfQuery : otherQuery;
  const user = query.data as AnyUser | undefined;

  const [editOpened, setEditOpened] = useState(false);
  const [deactivationOpened, setDeactivationOpened] = useState(false);

  if (query.isLoading) {
    return (
      <Center w="100%" py="xl">
        <Loader />
      </Center>
    );
  }

  if (!user) return null;

  const canEdit = mode === 'self' || mode === 'admin';
  const canEditDetails = canEdit && (isSelfUser(user) || isAdminUser(user));
  const canDeactivate =
    currentUser?.role === USER_ROLES.USER && mode === 'self';
  const showPreferencesTab = mode === 'self' && isSelfUser(user);

  return (
    <Stack gap="lg" maw={920} w="100%" mx="auto">
      <ProfileHeaderBlock user={user} mode={mode} />

      <Tabs
        defaultValue="info"
        keepMounted
        className={styles.tabs}
        classNames={{ list: styles.tabsList, tab: styles.tab }}
        color="barter"
      >
        <Tabs.List>
          <Tabs.Tab
            value="info"
            leftSection={<Contact size={15} strokeWidth={2} />}
          >
            {t('profile.title')}
          </Tabs.Tab>
          {showPreferencesTab && (
            <Tabs.Tab
              value="preferences"
              leftSection={<Settings size={15} strokeWidth={2} />}
            >
              {t('profile.savePreferences').split(' ')[0]}
            </Tabs.Tab>
          )}
          {canDeactivate && (
            <Tabs.Tab
              value="danger"
              leftSection={<ShieldAlert size={15} strokeWidth={2} />}
              color="red"
            >
              {t('deactivation.title')}
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="info" className={styles.tabPanel}>
          <Stack gap="lg">
            <ProfileContactsBlock
              user={user}
              role={currentUser?.role}
              mode={mode}
            />

            {canEditDetails && (
              <Group justify="flex-end">
                <Button
                  leftSection={<Pencil size={16} />}
                  onClick={() => setEditOpened(true)}
                >
                  {t('profile.editData')}
                </Button>
              </Group>
            )}
          </Stack>
        </Tabs.Panel>

        {showPreferencesTab && (
          <Tabs.Panel value="preferences" className={styles.tabPanel}>
            <ProfilePreferencesBlock user={user} />
          </Tabs.Panel>
        )}

        {canDeactivate && (
          <Tabs.Panel value="danger" className={styles.tabPanel}>
            <div className={styles.dangerZone}>
              <div className={styles.dangerInfo}>
                <span className={styles.dangerTitle}>
                  {t('deactivation.title')}
                </span>
                <span className={styles.dangerText}>
                  {t('deactivation.text')}
                </span>
              </div>
              <Button
                variant="filled"
                color="red"
                leftSection={<UserX size={16} />}
                onClick={() => setDeactivationOpened(true)}
              >
                {t('deactivation.deactivate')}
              </Button>
            </div>
          </Tabs.Panel>
        )}
      </Tabs>

      {canEditDetails && (
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
