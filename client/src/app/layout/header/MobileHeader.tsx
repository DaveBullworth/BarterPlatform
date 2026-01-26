import { Group, ActionIcon, TextInput } from '@mantine/core';
import { Home, Plus, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/shared/constants/routes';

export const MobileHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isRoot = location.pathname === ROUTES.ROOT;

  return (
    <Group h="100%" px="md" gap="sm" hiddenFrom="sm" wrap="nowrap">
      {/* HOME */}

      <ActionIcon
        variant="light"
        size="lg"
        onClick={() => {
          if (!isRoot) {
            navigate(ROUTES.ROOT);
          }
        }}
      >
        <Home size={18} />
      </ActionIcon>

      {/* SEARCH */}
      <TextInput
        placeholder="Поиск лотов"
        rightSection={<Search size={16} />}
        w="100%"
      />

      {/* CREATE LOT */}
      <ActionIcon variant="filled" size="lg">
        <Plus size={18} />
      </ActionIcon>
    </Group>
  );
};
