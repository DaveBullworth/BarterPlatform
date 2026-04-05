import { memo } from 'react';
import { Group, Text, Checkbox } from '@mantine/core';

type Props = {
  subcategory: {
    id: number;
    name: string;
  };

  selected: boolean;
  onSelect: () => void;
};

export const SubcategoryItem = memo(
  ({ subcategory, selected, onSelect }: Props) => {
    return (
      <Group
        key={subcategory.id}
        justify="space-between"
        wrap="nowrap"
        style={{
          borderRadius: 8,
          border: '1px solid var(--mantine-color-gray-2)',
          padding: '4px 10px',
          backgroundColor: selected
            ? 'var(--mantine-color-blue-0)'
            : 'var(--mantine-color-white)',
        }}
      >
        <Text size="sm">{subcategory.name}</Text>
        <Checkbox
          checked={selected}
          onChange={onSelect}
          aria-label={subcategory.name}
        />
      </Group>
    );
  },
);
