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
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, ChartColumnStacked } from 'lucide-react';

import { useAuthStore } from '@/entities/user';
import { useNavigation } from '@/shared/lib/navigation';
import { useCategorySelection } from '@/features/category-filter';
import { NAV_ACCESS } from '@/shared/constants/nav-access';
import { USER_ROLES } from '@/shared/constants/user-role';
import { ROUTES } from '@/shared/constants/routes';
import { ProfileDrawer } from './ProfileDrawer';
import { NAV_ITEMS } from './navigation';

type Props = {
  onOpenCategories: () => void;
};

type BottomNavItemProps = {
  label: string;
  icon: React.ReactNode;
  color?: string;
  onClick: () => void;
};

const BottomNavItem = ({ label, icon, color, onClick }: BottomNavItemProps) => (
  <UnstyledButton onClick={onClick}>
    <Stack align="center" gap={2}>
      {icon}
      <Text size="xs" c={color || 'inherit'}>
        {label}
      </Text>
    </Stack>
  </UnstyledButton>
);

const Separator = () => (
  <Box w={1} h="50%" bg="gray.4" style={{ alignSelf: 'center' }} />
);

export const MobileBottomNavbar = ({ onOpenCategories }: Props) => {
  const location = useLocation();
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const { isAuthenticated, currentUser } = useAuthStore();
  const { toAuth, toProfile } = useNavigation();
  const { selection } = useCategorySelection();
  const [drawerOpened, setDrawerOpened] = useState(false);
  const rawNavigate = useNavigate();

  const items = NAV_ITEMS.filter((item) => {
    if (item.key === 'profile') return false;
    if (item.access === NAV_ACCESS.PUBLIC) return true;
    if (item.access === NAV_ACCESS.AUTH) return isAuthenticated;
    if (item.access === NAV_ACCESS.ADMIN) {
      return isAuthenticated && currentUser?.role === USER_ROLES.ADMIN;
    }
    return false;
  });

  const profileActive = location.pathname.startsWith(ROUTES.PROFILE);

  return (
    <>
      <Group h="100%" justify="space-evenly" px="xs" align="center">
        <BottomNavItem
          label={t('nav.profile')}
          icon={
            <User
              size={20}
              color={profileActive ? theme.colors.blue[6] : undefined}
            />
          }
          color={profileActive ? theme.colors.blue[6] : undefined}
          onClick={() => setDrawerOpened(true)}
        />

        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.to === ROUTES.ROOT
              ? location.pathname === ROUTES.ROOT
              : location.pathname.startsWith(item.to);

          return (
            <React.Fragment key={item.key}>
              <Separator />
              <BottomNavItem
                label={t(`nav.${item.key}`)}
                icon={
                  <Icon
                    size={20}
                    color={active ? theme.colors.blue[6] : undefined}
                  />
                }
                color={active ? theme.colors.blue[6] : undefined}
                onClick={() => rawNavigate(item.to)}
              />
            </React.Fragment>
          );
        })}

        <Separator />

        <BottomNavItem
          label={t('header.categories')}
          icon={
            <Indicator disabled={!selection} size={10} color="red" offset={3}>
              <ChartColumnStacked size={20} />
            </Indicator>
          }
          color={selection ? theme.colors.red[6] : undefined}
          onClick={onOpenCategories}
        />
      </Group>

      <ProfileDrawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        onLogin={toAuth}
        onProfile={toProfile}
      />
    </>
  );
};
