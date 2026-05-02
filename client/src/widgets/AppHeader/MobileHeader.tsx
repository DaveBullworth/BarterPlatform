import { Group, ActionIcon, TextInput } from '@mantine/core';
import { Home, Plus, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { useNavigation } from '@/shared/lib/navigation';
import { GeoFilterButton } from '@/features/geo-filter';
import { ROUTES } from '@/shared/constants/routes';

export const MobileHeader = () => {
  const location = useLocation();
  const { toRoot, toLotCreate } = useNavigation();
  const isRoot = location.pathname === ROUTES.ROOT;

  return (
    <Group h="100%" px="0.5rem" gap="0.5rem" hiddenFrom="sm" wrap="nowrap">
      <ActionIcon
        variant="light"
        size="lg"
        onClick={() => {
          if (!isRoot) toRoot();
        }}
      >
        <Home size={18} />
      </ActionIcon>

      <TextInput
        placeholder="Поиск лотов"
        rightSection={<Search size={16} />}
        w="100%"
      />

      <GeoFilterButton />

      <ActionIcon variant="filled" size="lg" onClick={toLotCreate}>
        <Plus size={18} />
      </ActionIcon>
    </Group>
  );
};
