import {
  UnstyledButton,
  Burger,
  Group,
  Text,
  Button,
  TextInput,
} from '@mantine/core';
import { Search, Plus, ChartColumnStacked } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { UserMenu } from './UserMenu';
import { goToRoot, gotToLotCreate } from '@/shared/utils/navigation';
import { selectCategorySelection } from '@/store/categoryFilterSlice';
import { GeoFilterControl } from './GeoFilterControl';
import { selectIsAuthenticated } from '@/store/userSlice';
import { openAuthRequiredModal } from '@/shared/ui/AuthRequiredModal';
import { selectSearchQuery, setSearchQuery } from '@/store/searchFilterSlice';
import { useState } from 'react';

type DesktopHeaderProps = {
  desktopOpened: boolean;
  onToggleDesktop: () => void;
  onOpenCategories: () => void;
};

export const DesktopHeader = ({
  desktopOpened,
  onToggleDesktop,
  onOpenCategories,
}: DesktopHeaderProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchFromStore = useSelector(selectSearchQuery);
  const selectedCategory = useSelector(selectCategorySelection);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [value, setValue] = useState(searchFromStore);

  const handleSearch = () => {
    if (value !== searchFromStore) {
      dispatch(setSearchQuery(value));
    }
  };

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
        <UnstyledButton
          onClick={() => goToRoot(navigate)}
          style={{ cursor: 'pointer' }}
        >
          <Text fw={700} size="lg">
            {t('header.title')}
          </Text>
        </UnstyledButton>

        {/* CATEGORIES */}
        <Button
          variant={selectedCategory ? 'filled' : 'light'}
          color={selectedCategory ? 'red' : undefined}
          leftSection={<ChartColumnStacked size={16} />}
          onClick={onOpenCategories}
        >
          {t('header.categories')}
        </Button>

        {/* SEARCH */}
        <Group gap="xs" wrap="nowrap">
          <TextInput
            placeholder={t('header.lotSearch')}
            value={value}
            rightSection={
              <Search
                size={16}
                style={{ cursor: 'pointer' }}
                onClick={handleSearch}
              />
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            onChange={(e) => setValue(e.currentTarget.value)}
            w={320}
          />
          <GeoFilterControl />
        </Group>
      </Group>

      {/* RIGHT PART */}
      <Group gap="sm">
        {/* CREATE LOT */}
        <Button
          leftSection={<Plus size={16} />}
          onClick={() =>
            isAuthenticated
              ? gotToLotCreate(navigate)
              : openAuthRequiredModal(navigate, t)
          }
        >
          {t('header.createLot')}
        </Button>

        {/* USER MENU */}
        <UserMenu />
      </Group>
    </Group>
  );
};
