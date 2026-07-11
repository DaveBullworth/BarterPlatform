import { Stack, NavLink, Badge } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/entities/user';
import { useChatUnreadCount } from '@/entities/chat';
import { useNavigation } from '@/shared/lib/navigation';
import { openAuthRequiredModal } from '@/features/auth';
import { NAV_ACCESS } from '@/shared/constants/nav-access';
import { USER_ROLES } from '@/shared/constants/user-role';
import { preload } from '@/shared/lib/preload';
import { NAV_ITEMS } from './navigation';

import styles from './AppNavbar.module.scss';

export const DesktopNavbar = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated, currentUser } = useAuthStore();
  const { toAuth } = useNavigation();
  const { data: chatUnread = 0 } = useChatUnreadCount(isAuthenticated);

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.access === NAV_ACCESS.PUBLIC) return true;
    if (item.access === NAV_ACCESS.AUTH) return true;
    if (item.access === NAV_ACCESS.ADMIN) {
      return isAuthenticated && currentUser?.role === USER_ROLES.ADMIN;
    }
    return false;
  });

  return (
    <Stack gap={4} className={styles.navStack}>
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active =
          item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);

        // На пункте «Предложения» — бейдж непрочитанных сообщений чата.
        const rightSection =
          item.key === 'offers' && isAuthenticated && chatUnread > 0 ? (
            <Badge size="sm" circle color="red">
              {chatUnread}
            </Badge>
          ) : (
            item.rightSection?.({ isAuthenticated })
          );

        return (
          <NavLink
            key={item.key}
            className={styles.navLink}
            label={t(`nav.${item.key}`)}
            leftSection={<Icon size={18} />}
            active={active}
            component={Link}
            to={item.to}
            description={
              item.description
                ? t(item.description({ isAuthenticated }) as string)
                : undefined
            }
            rightSection={rightSection}
            onMouseEnter={
              item.preload ? () => preload(item.preload!) : undefined
            }
            onFocus={
              item.preload ? () => preload(item.preload!) : undefined
            }
            onTouchStart={
              item.preload ? () => preload(item.preload!) : undefined
            }
            onClick={(e) => {
              if (item.access === NAV_ACCESS.AUTH && !isAuthenticated) {
                e.preventDefault();
                openAuthRequiredModal(toAuth, t);
              }
            }}
          />
        );
      })}
    </Stack>
  );
};
