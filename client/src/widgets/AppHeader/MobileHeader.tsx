import { Group, ActionIcon, TextInput } from '@mantine/core';
import { Home, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useNavigation } from '@/shared/lib/navigation';
import { GeoFilterButton } from '@/features/geo-filter';
import { useSearchQuery } from '@/features/search-filter';
import { ROUTES } from '@/shared/constants/routes';

export const MobileHeader = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { toRoot, toLotCreate } = useNavigation();
  const { query, setQuery } = useSearchQuery();
  const [localSearch, setLocalSearch] = useState(query);
  const isRoot = location.pathname === ROUTES.ROOT;

  const handleSearch = () => {
    if (localSearch !== query) {
      setQuery(localSearch);
    }
  };

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
        placeholder={t('header.lotSearch')}
        value={localSearch}
        rightSection={
          <Search
            size={16}
            style={{ cursor: 'pointer' }}
            onClick={handleSearch}
          />
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSearch();
        }}
        onChange={(e) => setLocalSearch(e.currentTarget.value)}
        w="100%"
      />

      <GeoFilterButton />

      <ActionIcon variant="filled" size="lg" onClick={toLotCreate}>
        <Plus size={18} />
      </ActionIcon>
    </Group>
  );
};
