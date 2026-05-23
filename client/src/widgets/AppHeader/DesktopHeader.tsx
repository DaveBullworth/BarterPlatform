import {
  UnstyledButton,
  Burger,
  Group,
  Text,
  Button,
  TextInput,
} from '@mantine/core';
import {
  Search,
  Plus,
  ChartColumnStacked,
  ArrowLeftRight,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/entities/user';
import { useNavigation } from '@/shared/lib/navigation';
import { openAuthRequiredModal } from '@/features/auth';
import { useCategorySelection } from '@/features/category-filter';
import { GeoFilterButton } from '@/features/geo-filter';
import { useSearchQuery } from '@/features/search-filter';
import { UserMenu } from './UserMenu';

import styles from './AppHeader.module.scss';

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
    <Group
      h="100%"
      px="md"
      justify="space-between"
      visibleFrom="sm"
      className={styles.header}
      wrap="nowrap"
    >
      <Group gap="sm" wrap="nowrap">
        <Burger
          opened={desktopOpened}
          onClick={onToggleDesktop}
          visibleFrom="sm"
          size="sm"
          color="var(--mantine-color-dimmed)"
        />

        <UnstyledButton
          onClick={toRoot}
          className={styles.logoButton}
          aria-label={t('header.title')}
        >
          <span className={styles.logoMark}>
            <ArrowLeftRight size={18} strokeWidth={2.4} />
          </span>
          <Text className={styles.logoName} component="span">
            {t('header.title')}
          </Text>
        </UnstyledButton>

        <Button
          variant={selection ? 'filled' : 'subtle'}
          color={selection ? 'accent' : 'gray'}
          leftSection={<ChartColumnStacked size={16} />}
          onClick={onOpenCategories}
          size="sm"
        >
          {t('header.categories')}
          {selection && <span className={styles.categoryActiveDot} />}
        </Button>

        <Group gap="xs" wrap="nowrap">
          <TextInput
            className={styles.searchInput}
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
          />
          <GeoFilterButton />
        </Group>
      </Group>

      <Group gap="sm" wrap="nowrap">
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
