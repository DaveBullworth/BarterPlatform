import { Burger, Group } from '@mantine/core';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import { ThemeSwitcher } from '@/shared/ui/ThemeSwitcher';

type Props = {
  mobileOpened: boolean;
  desktopOpened: boolean;
  onToggleMobile: () => void;
  onToggleDesktop: () => void;
};

export const MainHeader = ({
  mobileOpened,
  desktopOpened,
  onToggleMobile,
  onToggleDesktop,
}: Props) => {
  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        {/* mobile */}
        <Burger
          opened={mobileOpened}
          onClick={onToggleMobile}
          hiddenFrom="sm"
          size="sm"
        />

        {/* desktop */}
        <Burger
          opened={desktopOpened}
          onClick={onToggleDesktop}
          visibleFrom="sm"
          size="sm"
        />
      </Group>

      <Group gap="xs">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </Group>
    </Group>
  );
};
