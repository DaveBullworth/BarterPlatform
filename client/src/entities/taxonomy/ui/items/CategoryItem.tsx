import { Stack, UnstyledButton, Group, Box } from '@mantine/core';
import { ChevronRight } from 'lucide-react';
import { type ReactNode } from 'react';

import type { Category } from '@/entities/taxonomy';

import styles from '../Taxonomy.module.scss';

type CategoryItemProps = {
  category: Category;
  expanded: boolean;
  selected?: boolean;
  hasSubcategories: boolean;
  onToggle?: () => void;
  rightSection?: ReactNode;
  children?: ReactNode;
};

export const CategoryItem = ({
  category,
  expanded,
  selected,
  hasSubcategories,
  onToggle,
  rightSection,
  children,
}: CategoryItemProps) => {
  const buttonClass = [
    styles.category,
    hasSubcategories ? styles.categoryClickable : styles.categoryStatic,
    selected ? styles.categorySelected : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Stack gap={4}>
      <UnstyledButton
        component="div"
        onClick={hasSubcategories ? onToggle : undefined}
        className={buttonClass}
      >
        <Group justify="space-between" wrap="nowrap">
          <span className={styles.categoryName}>{category.name}</span>
          <Group gap="xs" wrap="nowrap">
            {hasSubcategories ? (
              <ChevronRight
                size={14}
                className={`${styles.chevron} ${
                  expanded ? styles.chevronOpen : ''
                }`}
              />
            ) : (
              <Box w={14} />
            )}
            {rightSection}
          </Group>
        </Group>
      </UnstyledButton>
      {hasSubcategories && children}
    </Stack>
  );
};
