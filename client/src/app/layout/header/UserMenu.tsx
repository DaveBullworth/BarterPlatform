import { Menu, ActionIcon, Avatar, Group } from '@mantine/core';
import { User, LogIn, LogOut } from 'lucide-react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { goToProfile, goToAuth } from '@/shared/utils/navigation';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import { ThemeSwitcher } from '@/shared/ui/ThemeSwitcher';
import { LogoutModal } from '@/shared/ui/LogoutModal';
import type { RootState } from '@/store';

export const UserMenu = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { isAuthenticated, name } = useSelector((s: RootState) => s.user);

  const [logoutOpened, { open: openLogout, close: closeLogout }] =
    useDisclosure(false);

  const initial = isAuthenticated && name ? name[0].toUpperCase() : null;

  return (
    <>
      <Menu position="bottom-end" shadow="md" width={220}>
        <Menu.Target>
          <ActionIcon variant="outline" radius="lg" size="lg">
            {isAuthenticated && initial ? (
              <Avatar size={40}>{initial}</Avatar>
            ) : (
              <User size={18} />
            )}
          </ActionIcon>
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

      {/* LOGOUT MODAL */}
      <LogoutModal opened={logoutOpened} onClose={closeLogout} />
    </>
  );
};
