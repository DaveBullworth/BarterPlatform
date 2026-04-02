import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { DesktopHeader } from './header/DesktopHeader';
import { MobileHeader } from './header/MobileHeader';
import { DesktopNavbar } from './navbar/DesktopNavbar';
import { MobileBottomNavbar } from './navbar/MobileBottomNavbar';
import { CategoriesDrawer } from './CategoriesDrawer';

import styles from './MainLayout.module.scss';

export const MainLayout = () => {
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const [categoriesOpened, { open: openCategories, close: closeCategories }] =
    useDisclosure(false);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { desktop: !desktopOpened, mobile: true },
      }}
      footer={window.innerWidth < 768 ? { height: 64 } : undefined} // только для mobile
      padding="md"
    >
      {/* HEADER */}
      <AppShell.Header>
        <DesktopHeader
          desktopOpened={desktopOpened}
          onToggleDesktop={toggleDesktop}
          onOpenCategories={openCategories}
        />
        <MobileHeader />
      </AppShell.Header>

      {/* DESKTOP NAVBAR */}
      <AppShell.Navbar visibleFrom="sm" p="xs">
        <DesktopNavbar />
      </AppShell.Navbar>

      {/* MOBILE FOOTER NAVBAR */}
      <AppShell.Footer hiddenFrom="sm">
        <MobileBottomNavbar onOpenCategories={openCategories} />
      </AppShell.Footer>

      <CategoriesDrawer opened={categoriesOpened} onClose={closeCategories} />

      <AppShell.Main className={styles.mainLayout}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};
