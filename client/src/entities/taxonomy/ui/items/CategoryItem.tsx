import { Stack, UnstyledButton, Group, Text, Box } from '@mantine/core';
import { ChevronRight } from 'lucide-react';
import { type ReactNode } from 'react';
import type { Category } from '@/entities/taxonomy';

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
  return (
    <Stack gap={4}>
      <UnstyledButton
        onClick={hasSubcategories ? onToggle : undefined}
        style={{
          borderRadius: 8,
          border: '1px solid var(--mantine-color-gray-2)',
          padding: '6px 10px',
          backgroundColor: selected
            ? 'var(--mantine-color-blue-0)'
            : 'transparent',
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm">{category.name}</Text>
          <Group gap="xs" wrap="nowrap">
            {hasSubcategories ? (
              <ChevronRight
                size={14}
                style={{
                  transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 150ms ease',
                }}
              />
            ) : (
              <Box w={14} />
            )}
            {rightSection}
          </Group>
        </Group>
      </UnstyledButton>
      {hasSubcategories && expanded && children}
    </Stack>
  );
};
