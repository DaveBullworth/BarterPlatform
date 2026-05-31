import {
  Drawer,
  Stack,
  Group,
  Text,
  Divider,
  Button,
  Indicator,
} from '@mantine/core';
import {
  User,
  LogIn,
  LogOut,
  HatGlasses,
  Bell,
  Package,
  SlidersHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStore, useSelfUser } from '@/entities/user';
import { LogoutModal } from '@/features/auth';
import { TaxonomyPreferencesModal } from '@/features/taxonomy-preferences';
import { LanguageSwitcher, ThemeSwitcher } from '@/shared/ui';
import { NotificationsDrawer } from '@/widgets/AppHeader';

import styles from './AppNavbar.module.scss';

type Props = {
  opened: boolean;
  onClose: () => void;
  onLogin: () => void;
  onProfile: () => void;
  onMyLots: () => void;
};

export const ProfileDrawer = ({
  opened,
  onClose,
  onLogin,
  onProfile,
  onMyLots,
}: Props) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { data: user } = useSelfUser();
  const [logoutOpened, setLogoutOpened] = useState(false);
  const [notificationsOpened, setNotificationsOpened] = useState(false);
  const [preferencesOpened, setPreferencesOpened] = useState(false);

  const unreadCount = 4; // TODO: заменить на реальные данные

  return (
    <>
      <Drawer
        opened={opened}
        onClose={onClose}
        position="bottom"
        padding="md"
        radius="md"
        size="auto"
        title={
          <Text size="md" td="underline">
            {t('nav.profile')}
          </Text>
        }
        className={styles.userDrawer}
      >
        <Stack gap="sm">
          <Group>
            {isAuthenticated ? <User size={20} /> : <HatGlasses size={20} />}
            <Text fw={500}>
              {isAuthenticated
                ? (user?.name ?? t('common.user'))
                : t('common.guest')}
            </Text>
          </Group>

          <Divider />

          <Group gap="sm" grow>
            <LanguageSwitcher />
            <ThemeSwitcher />
          </Group>

          <Divider />

          {isAuthenticated && (
            <>
              <Button
                variant="light"
                leftSection={<User size={16} />}
                onClick={() => {
                  onProfile();
                  onClose();
                }}
              >
                {t('nav.profile')}
              </Button>

              <Button
                variant="light"
                leftSection={<Package size={16} />}
                onClick={() => {
                  onMyLots();
                  onClose();
                }}
              >
                {t('nav.myLots')}
              </Button>

              <Button
                variant="light"
                leftSection={<SlidersHorizontal size={16} />}
                onClick={() => {
                  setPreferencesOpened(true);
                  onClose();
                }}
              >
                {t('preferences.menuItem')}
              </Button>

              <Button
                variant="light"
                leftSection={
                  <Indicator
                    inline
                    size={14}
                    color="red"
                    disabled={!unreadCount}
                    label={unreadCount}
                  >
                    <Bell size={16} />
                  </Indicator>
                }
                onClick={() => {
                  setNotificationsOpened(true);
                  onClose();
                }}
              >
                {t('notifications.title')}
              </Button>

              <Divider />
            </>
          )}

          {isAuthenticated ? (
            <Button
              color="red"
              variant="light"
              leftSection={<LogOut size={16} />}
              onClick={() => setLogoutOpened(true)}
            >
              {t('common.exit')}
            </Button>
          ) : (
            <Button
              leftSection={<LogIn size={16} />}
              onClick={() => {
                onLogin();
                onClose();
              }}
            >
              {t('authRequired.login')}
            </Button>
          )}
        </Stack>
      </Drawer>

      <NotificationsDrawer
        opened={notificationsOpened}
        onClose={() => setNotificationsOpened(false)}
      />

      <TaxonomyPreferencesModal
        opened={preferencesOpened}
        onClose={() => setPreferencesOpened(false)}
      />

      <LogoutModal
        opened={logoutOpened}
        onClose={() => setLogoutOpened(false)}
      />
    </>
  );
};
