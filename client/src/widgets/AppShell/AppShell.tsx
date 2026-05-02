import { useState } from 'react';
import { AppShell as MantineAppShell } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';

import { DesktopHeader, MobileHeader } from '@/widgets/AppHeader';
import { DesktopNavbar, MobileBottomNavbar } from '@/widgets/AppNavbar';
import { CategoriesDrawer } from '@/features/category-filter';

export const AppShell = () => {
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const [categoriesOpened, { open: openCategories, close: closeCategories }] =
    useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 48em)');

  // search управляется через URL в будущем,
  // пока простой state для передачи в header
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <MantineAppShell
      header={{ height: 56 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { desktop: !desktopOpened, mobile: true },
      }}
      footer={isMobile ? { height: 64 } : undefined}
      padding="md"
    >
      <MantineAppShell.Header>
        <DesktopHeader
          desktopOpened={desktopOpened}
          onToggleDesktop={toggleDesktop}
          onOpenCategories={openCategories}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <MobileHeader />
      </MantineAppShell.Header>

      <MantineAppShell.Navbar visibleFrom="sm" p="xs">
        <DesktopNavbar />
      </MantineAppShell.Navbar>

      <MantineAppShell.Footer hiddenFrom="sm">
        <MobileBottomNavbar onOpenCategories={openCategories} />
      </MantineAppShell.Footer>

      <CategoriesDrawer opened={categoriesOpened} onClose={closeCategories} />

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>
    </MantineAppShell>
  );
};
