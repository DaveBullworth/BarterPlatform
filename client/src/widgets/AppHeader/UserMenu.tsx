import { Menu, ActionIcon, Avatar, Group, Indicator } from '@mantine/core';
import { User, LogIn, LogOut, Bell, Package } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStore, useSelfUser } from '@/entities/user';
import { useNavigation } from '@/shared/lib/navigation';
import { LogoutModal } from '@/features/auth';
import { LanguageSwitcher, ThemeSwitcher } from '@/shared/ui';
import { NotificationsDrawer } from './NotificationsDrawer';

export const UserMenu = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { data: user } = useSelfUser();
  const { toProfile, toAuth, toMyLots } = useNavigation();

  const [logoutOpened, setLogoutOpened] = useState(false);
  const [notificationsOpened, setNotificationsOpened] = useState(false);

  const unreadCount = 4; // TODO: реальные данные

  const initial =
    isAuthenticated && user?.name ? user.name[0].toUpperCase() : null;

  return (
    <>
      <Menu position="bottom-end" shadow="md" width={220}>
        <Menu.Target>
          <Indicator
            disabled={!unreadCount}
            color="red"
            size={8}
            offset={4}
            position="top-end"
          >
            <ActionIcon variant="outline" radius="lg" size="lg">
              {isAuthenticated && initial ? (
                <Avatar size={40}>{initial}</Avatar>
              ) : (
                <User size={18} />
              )}
            </ActionIcon>
          </Indicator>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item closeMenuOnClick={false}>
            <LanguageSwitcher />
          </Menu.Item>

          <Menu.Item closeMenuOnClick={false}>
            <Group grow>
              <ThemeSwitcher />
            </Group>
          </Menu.Item>

          <Menu.Divider />

          {isAuthenticated && (
            <>
              <Menu.Item
                leftSection={<User size={16} />}
                onClick={() => toProfile()}
              >
                {t('nav.profile')}
              </Menu.Item>

              <Menu.Item
                leftSection={<Package size={16} />}
                onClick={() => toMyLots()}
              >
                {t('nav.myLots')}
              </Menu.Item>

              <Menu.Item
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
                onClick={() => setNotificationsOpened(true)}
              >
                {t('notifications.title')}
              </Menu.Item>

              <Menu.Divider />
            </>
          )}

          {isAuthenticated ? (
            <Menu.Item
              color="red"
              leftSection={<LogOut size={16} />}
              onClick={() => setLogoutOpened(true)}
            >
              {t('common.exit')}
            </Menu.Item>
          ) : (
            <Menu.Item
              leftSection={<LogIn size={16} />}
              onClick={() => toAuth()}
            >
              {t('authRequired.login')}
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>

      <NotificationsDrawer
        opened={notificationsOpened}
        onClose={() => setNotificationsOpened(false)}
      />

      <LogoutModal
        opened={logoutOpened}
        onClose={() => setLogoutOpened(false)}
      />
    </>
  );
};
