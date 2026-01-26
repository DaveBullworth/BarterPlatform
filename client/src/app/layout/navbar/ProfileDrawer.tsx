import { Drawer, Stack, Group, Text, Divider, Button } from '@mantine/core';
import { User, LogIn, LogOut, HatGlasses } from 'lucide-react';

import { useDisclosure } from '@mantine/hooks';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type { RootState } from '@/store';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import { ThemeSwitcher } from '@/shared/ui/ThemeSwitcher';
import { LogoutModal } from '@/shared/ui/LogoutModal';

import styles from '../MainLayout.module.scss';

type ProfileDrawerProps = {
  opened: boolean;
  onClose: () => void;

  onLogin: () => void;
  onProfile: () => void;
};

export const ProfileDrawer = ({
  opened,
  onClose,
  onLogin,
  onProfile,
}: ProfileDrawerProps) => {
  const { t } = useTranslation();
  const { isAuthenticated, name } = useSelector((s: RootState) => s.user);

  const [logoutOpened, { open: openLogout, close: closeLogout }] =
    useDisclosure(false);

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
          {/* USER INFO */}
          <Group>
            {isAuthenticated ? <User size={20} /> : <HatGlasses size={20} />}
            <Text fw={500}>
              {isAuthenticated ? (name ?? t('common.user')) : t('common.guest')}
            </Text>
          </Group>

          <Divider />

          {/* SETTINGS */}

          <Group gap="sm" grow>
            <LanguageSwitcher />
            <ThemeSwitcher />
          </Group>

          <Divider />

          {/* AUTH USER */}
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

              <Divider />
            </>
          )}

          {/* AUTH ACTION */}
          {isAuthenticated ? (
            <Button
              color="red"
              variant="light"
              leftSection={<LogOut size={16} />}
              onClick={openLogout}
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

      {/* LOGOUT MODAL */}
      <LogoutModal opened={logoutOpened} onClose={closeLogout} />
    </>
  );
};
