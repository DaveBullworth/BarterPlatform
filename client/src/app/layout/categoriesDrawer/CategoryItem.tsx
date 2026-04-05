import { memo } from 'react';
import {
  Stack,
  UnstyledButton,
  Group,
  Text,
  Checkbox,
  Box,
} from '@mantine/core';
import { ChevronRight } from 'lucide-react';

type Props = {
  category: {
    id: number;
    name: string;
    subcategories: {
      id: number;
      name: string;
    }[];
  };

  expanded: boolean;
  selected: boolean;
  hasSubcategories: boolean;

  onToggle: () => void;
  onSelect: () => void;

  children?: React.ReactNode;
};

export const CategoryItem = memo(
  ({
    category,
    expanded,
    selected,
    hasSubcategories,
    onToggle,
    onSelect,
    children,
  }: Props) => {
    return (
      <Stack gap={4}>
        <UnstyledButton
          onClick={() => {
            if (!hasSubcategories) return;
            onToggle();
          }}
          style={{
            borderRadius: 8,
            border: '1px solid var(--mantine-color-gray-2)',
            padding: '6px 10px',
            cursor: hasSubcategories ? 'pointer' : 'default',
            backgroundColor: selected
              ? 'var(--mantine-color-blue-0)'
              : 'var(--mantine-color-white)',
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

              <Checkbox
                checked={selected}
                onChange={onSelect}
                onClick={(e) => e.stopPropagation()}
                aria-label={category.name}
              />
            </Group>
          </Group>
        </UnstyledButton>

        {/* КЛЮЧЕВАЯ ОПТИМИЗАЦИЯ */}
        {hasSubcategories && expanded && children}
      </Stack>
    );
  },
);
