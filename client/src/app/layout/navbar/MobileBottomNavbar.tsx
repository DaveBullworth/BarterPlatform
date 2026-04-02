import React from 'react';
import {
  Group,
  Stack,
  Text,
  UnstyledButton,
  Box,
  useMantineTheme,
  Indicator,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { ChartColumnStacked } from 'lucide-react';

import { NAV_ITEMS } from './navigation';
import { NAV_ACCESS } from '@/shared/constants/nav-access';
import { USER_ROLES } from '@/shared/constants/user-role';
import { ROUTES } from '@/shared/constants/routes';
import { ProfileDrawer } from './ProfileDrawer';
import { goToAuth, goToProfile } from '@/shared/utils/navigation';
import { selectCurrentUser, selectIsAuthenticated } from '@/store/userSlice';
import { selectCategorySelection } from '@/store/categoryFilterSlice';
import type { RootState } from '@/store';

type MobileBottomNavbarProps = {
  onOpenCategories: () => void;
};

export const MobileBottomNavbar = ({
  onOpenCategories,
}: MobileBottomNavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useMantineTheme();

  const user = useSelector((s: RootState) => selectCurrentUser(s));
  const isAuthenticated = useSelector((s: RootState) =>
    selectIsAuthenticated(s),
  );
  const selectedCategory = useSelector(selectCategorySelection);

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
        return isAuthenticated && user?.role === USER_ROLES.ADMIN;
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

        <Box w={1} h="50%" bg="gray.4" style={{ alignSelf: 'center' }} />
        <BottomNavItem
          label={t('header.categories')}
          icon={
            <Indicator
              disabled={!selectedCategory}
              size={10}
              color="red"
              offset={3}
            >
              <ChartColumnStacked size={20} />
            </Indicator>
          }
          color={selectedCategory ? theme.colors.red[6] : undefined}
          onClick={onOpenCategories}
        />
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
