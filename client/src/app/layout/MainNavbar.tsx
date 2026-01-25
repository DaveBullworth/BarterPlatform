import { Stack, NavLink } from '@mantine/core';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { NAV_ITEMS } from './navigation';
import { NAV_ACCESS } from '@/shared/constants/nav-access';
import { USER_ROLES } from '@/shared/constants/user-role';
import { openAuthRequiredModal } from '@/shared/ui/AuthRequiredModal';

export const MainNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { isAuthenticated, role } = useSelector((s: RootState) => s.user);

  return (
    <Stack gap={4}>
      {NAV_ITEMS.filter((item) => {
        switch (item.access) {
          case NAV_ACCESS.PUBLIC:
            return true;
          case NAV_ACCESS.AUTH:
            return true;
          case NAV_ACCESS.ADMIN:
            return isAuthenticated && role === USER_ROLES.ADMIN;
          default:
            return false;
        }
      }).map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.key}
            fw={600}
            label={t(`nav.${item.key}`)}
            leftSection={<Icon size={16} />}
            active={
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
            }
            component={Link}
            to={item.to}
            description={
              item.description
                ? t(item.description({ isAuthenticated }) as string)
                : undefined
            }
            rightSection={
              item.rightSection
                ? item.rightSection({ isAuthenticated })
                : undefined
            }
            onClick={(e) => {
              if (item.access === NAV_ACCESS.AUTH && !isAuthenticated) {
                e.preventDefault();
                openAuthRequiredModal(navigate, t);
              }
            }}
          />
        );
      })}
    </Stack>
  );
};
