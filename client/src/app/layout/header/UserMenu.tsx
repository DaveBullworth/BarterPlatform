import { Menu, ActionIcon, Avatar, Group, Indicator } from '@mantine/core';
import { User, LogIn, LogOut, Bell } from 'lucide-react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { NotificationsDrawer } from '../NotificationsDrawer';
import { goToProfile, goToAuth } from '@/shared/utils/navigation';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import { ThemeSwitcher } from '@/shared/ui/ThemeSwitcher';
import { LogoutModal } from '@/shared/ui/LogoutModal';
import type { RootState } from '@/store';

export const UserMenu = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { isAuthenticated, name } = useSelector((s: RootState) => s.user);

  // временно, потом Redux
  const unreadCount = 4;

  const [logoutOpened, { open: openLogout, close: closeLogout }] =
    useDisclosure(false);

  const [notificationsOpened, notifications] = useDisclosure(false);

  const initial = isAuthenticated && name ? name[0].toUpperCase() : null;

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
          {/* COMMON */}
          <Menu.Item closeMenuOnClick={false}>
            <LanguageSwitcher />
          </Menu.Item>

          <Menu.Item closeMenuOnClick={false}>
            <Group grow>
              <ThemeSwitcher />
            </Group>
          </Menu.Item>

          <Menu.Divider />

          {/* AUTH USER */}
          {isAuthenticated && (
            <>
              <Menu.Item
                leftSection={<User size={16} />}
                onClick={() => goToProfile(navigate)}
              >
                {t('nav.profile')}
              </Menu.Item>

              {/* NOTIFICATIONS */}
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
                onClick={notifications.open}
              >
                {t('notifications.title')}
              </Menu.Item>

              <Menu.Divider />
            </>
          )}

          {/* AUTH / GUEST ACTION */}
          {isAuthenticated ? (
            <Menu.Item
              color="red"
              leftSection={<LogOut size={16} />}
              onClick={openLogout}
            >
              {t('common.exit')}
            </Menu.Item>
          ) : (
            <Menu.Item
              leftSection={<LogIn size={16} />}
              onClick={() => goToAuth(navigate)}
            >
              {t('authRequired.login')}
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>

      {/* DRAWERS */}
      <NotificationsDrawer
        opened={notificationsOpened}
        onClose={notifications.close}
      />

      {/* LOGOUT MODAL */}
      <LogoutModal opened={logoutOpened} onClose={closeLogout} />
    </>
  );
};
