import { Burger, Group, Text, Button, TextInput } from '@mantine/core';
import { Search, Plus, ChartColumnStacked } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserMenu } from './UserMenu';

type DesktopHeaderProps = {
  desktopOpened: boolean;
  onToggleDesktop: () => void;
};

export const DesktopHeader = ({
  desktopOpened,
  onToggleDesktop,
}: DesktopHeaderProps) => {
  const { t } = useTranslation();
  return (
    <Group h="100%" px="md" justify="space-between" visibleFrom="sm">
      {/* LEFT PART */}
      <Group gap="sm">
        <Burger
          opened={desktopOpened}
          onClick={onToggleDesktop}
          visibleFrom="sm"
          size="sm"
        />

        {/* LOGO / TITLE */}
        <Text fw={700} size="lg">
          {t('header.title')}
        </Text>

        {/* CATEGORIES */}
        <Button variant="light" leftSection={<ChartColumnStacked size={16} />}>
          {t('header.categories')}
        </Button>

        {/* SEARCH */}
        <TextInput
          placeholder={t('header.lotSearch')}
          rightSection={<Search size={16} />}
          w={320}
        />
      </Group>

      {/* RIGHT PART */}
      <Group gap="sm">
        {/* CREATE LOT */}
        <Button leftSection={<Plus size={16} />}>
          {t('header.createLot')}
        </Button>

        {/* USER MENU */}
        <UserMenu />
      </Group>
    </Group>
  );
};
