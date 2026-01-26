import React from 'react';
import {
  Group,
  Stack,
  Text,
  UnstyledButton,
  Box,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';

import type { RootState } from '@/store';
import { NAV_ITEMS } from './navigation';
import { NAV_ACCESS } from '@/shared/constants/nav-access';
import { USER_ROLES } from '@/shared/constants/user-role';
import { ROUTES } from '@/shared/constants/routes';
import { ProfileDrawer } from './ProfileDrawer';
import { goToAuth, goToProfile } from '@/shared/utils/navigation';

export const MobileBottomNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useMantineTheme();

  const { isAuthenticated, role } = useSelector((s: RootState) => s.user);

  const [drawerOpened, { open, close }] = useDisclosure(false);

  // mobile: фильтруем пункты, КРОМЕ profile
  const items = NAV_ITEMS.filter((item) => {
    if (item.key === 'profile') return false;

    switch (item.access) {
      case NAV_ACCESS.PUBLIC:
        return true;
      case NAV_ACCESS.AUTH:
        return isAuthenticated;
      case NAV_ACCESS.ADMIN:
        return isAuthenticated && role === USER_ROLES.ADMIN;
      default:
        return false;
    }
  });

  // profile active если сейчас на ROUTES.PROFILE
  const profileActive = location.pathname.startsWith(ROUTES.PROFILE);

  return (
    <>
      <Group h="100%" justify="space-evenly" px="xs" align="center">
        {/* PROFILE (ALWAYS FIRST) */}
        <BottomNavItem
          label={t('nav.profile')}
          icon={
            <User
              size={20}
              color={profileActive ? theme.colors.blue[6] : undefined}
            />
          }
          color={profileActive ? theme.colors.blue[6] : undefined}
          onClick={open}
        />

        {/* OTHER NAV ITEMS */}
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            item.to === ROUTES.ROOT
              ? location.pathname === ROUTES.ROOT
              : location.pathname.startsWith(item.to);

          return (
            <React.Fragment key={item.key}>
              {/* вертикальный разделитель */}
              <Box
                w={1} // 1px ширина
                h="50%" // половина высоты navbar
                bg="gray.4" // тонкая серая линия
                style={{ alignSelf: 'center' }}
              />
              <BottomNavItem
                key={item.key}
                label={t(`nav.${item.key}`)}
                icon={
                  <Icon
                    size={20}
                    color={active ? theme.colors.blue[6] : undefined}
                  />
                }
                color={active ? theme.colors.blue[6] : undefined}
                onClick={() => navigate(item.to)}
              />
            </React.Fragment>
          );
        })}
      </Group>

      {/* PROFILE DRAWER */}
      <ProfileDrawer
        opened={drawerOpened}
        onClose={close}
        onLogin={() => goToAuth(navigate)}
        onProfile={() => goToProfile(navigate)}
      />
    </>
  );
};

type BottomNavItemProps = {
  label: string;
  icon: React.ReactNode;

  color?: string;
  onClick: () => void;
};

const BottomNavItem = ({ label, icon, color, onClick }: BottomNavItemProps) => {
  return (
    <UnstyledButton onClick={onClick}>
      <Stack align="center" gap={2}>
        {icon}
        <Text size="xs" c={color || 'inherit'}>
          {label}
        </Text>
      </Stack>
    </UnstyledButton>
  );
};
