import React, { useState } from 'react';
import { Group, Text, UnstyledButton, Indicator } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, ChartColumnStacked } from 'lucide-react';

import { useAuthStore } from '@/entities/user';
import { useChatUnreadCount } from '@/entities/chat';
import { useNavigation } from '@/shared/lib/navigation';
import { useCategorySelection } from '@/features/category-filter';
import { NAV_ACCESS } from '@/shared/constants/nav-access';
import { USER_ROLES } from '@/shared/constants/user-role';
import { ROUTES } from '@/shared/constants/routes';
import { preload } from '@/shared/lib/preload';
import { ProfileDrawer } from './ProfileDrawer';
import { NAV_ITEMS } from './navigation';

import styles from './AppNavbar.module.scss';

type Props = {
  onOpenCategories: () => void;
};

type BottomNavItemProps = {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  onPreload?: () => void;
};

const BottomNavItem = ({
  label,
  icon,
  active,
  onClick,
  onPreload,
}: BottomNavItemProps) => (
  <UnstyledButton
    onClick={onClick}
    onTouchStart={onPreload}
    onMouseEnter={onPreload}
    className={styles.mobileItem}
    data-active={active}
  >
    {icon}
    <Text component="span" className={styles.mobileItemLabel}>
      {label}
    </Text>
  </UnstyledButton>
);

export const MobileBottomNavbar = ({ onOpenCategories }: Props) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated, currentUser } = useAuthStore();
  const { data: chatUnread = 0 } = useChatUnreadCount(isAuthenticated);
  const { toAuth, toProfile, toMyLots } = useNavigation();
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
      <Group
        h="100%"
        justify="space-around"
        px="xs"
        align="center"
        className={styles.mobileBar}
      >
        <BottomNavItem
          label={t('nav.profile')}
          icon={<User size={20} />}
          active={profileActive}
          onClick={() => setDrawerOpened(true)}
          onPreload={() => preload('profile')}
        />

        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.to === ROUTES.ROOT
              ? location.pathname === ROUTES.ROOT
              : location.pathname.startsWith(item.to);

          const showChatBadge = item.key === 'offers' && chatUnread > 0;

          return (
            <React.Fragment key={item.key}>
              <BottomNavItem
                label={t(`nav.${item.key}`)}
                icon={
                  showChatBadge ? (
                    <Indicator color="red" size={8} offset={2}>
                      <Icon size={20} />
                    </Indicator>
                  ) : (
                    <Icon size={20} />
                  )
                }
                active={active}
                onClick={() => rawNavigate(item.to)}
                onPreload={
                  item.preload ? () => preload(item.preload!) : undefined
                }
              />
            </React.Fragment>
          );
        })}

        <BottomNavItem
          label={t('header.categories')}
          icon={
            <Indicator
              disabled={!selection}
              size={8}
              color="accent"
              offset={3}
            >
              <ChartColumnStacked size={20} />
            </Indicator>
          }
          active={!!selection}
          onClick={onOpenCategories}
        />
      </Group>

      <ProfileDrawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        onLogin={toAuth}
        onProfile={toProfile}
        onMyLots={toMyLots}
      />
    </>
  );
};
