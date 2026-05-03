import {
  UnstyledButton,
  Burger,
  Group,
  Text,
  Button,
  TextInput,
} from '@mantine/core';
import { Search, Plus, ChartColumnStacked } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/entities/user';
import { useNavigation } from '@/shared/lib/navigation';
import { openAuthRequiredModal } from '@/features/auth';
import { useCategorySelection } from '@/features/category-filter';
import { GeoFilterButton } from '@/features/geo-filter';
import { useSearchQuery } from '@/features/search-filter';
import { UserMenu } from './UserMenu';

type Props = {
  desktopOpened: boolean;
  onToggleDesktop: () => void;
  onOpenCategories: () => void;
};

export const DesktopHeader = ({
  desktopOpened,
  onToggleDesktop,
  onOpenCategories,
}: Props) => {
  const { t } = useTranslation();
  const { toRoot, toLotCreate, toAuth } = useNavigation();
  const { isAuthenticated } = useAuthStore();
  const { selection } = useCategorySelection();
  const { query, setQuery } = useSearchQuery();
  const [localSearch, setLocalSearch] = useState(query);

  const handleSearch = () => {
    if (localSearch !== query) {
      setQuery(localSearch);
    }
  };

  return (
    <Group h="100%" px="md" justify="space-between" visibleFrom="sm">
      <Group gap="sm">
        <Burger
          opened={desktopOpened}
          onClick={onToggleDesktop}
          visibleFrom="sm"
          size="sm"
        />

        <UnstyledButton onClick={toRoot} style={{ cursor: 'pointer' }}>
          <Text fw={700} size="lg">
            {t('header.title')}
          </Text>
        </UnstyledButton>

        <Button
          variant={selection ? 'filled' : 'light'}
          color={selection ? 'red' : undefined}
          leftSection={<ChartColumnStacked size={16} />}
          onClick={onOpenCategories}
        >
          {t('header.categories')}
        </Button>

        <Group gap="xs" wrap="nowrap">
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
            w={320}
          />
          <GeoFilterButton />
        </Group>
      </Group>

      <Group gap="sm">
        <Button
          leftSection={<Plus size={16} />}
          onClick={() =>
            isAuthenticated ? toLotCreate() : openAuthRequiredModal(toAuth, t)
          }
        >
          {t('header.createLot')}
        </Button>

        <UserMenu />
      </Group>
    </Group>
  );
};
