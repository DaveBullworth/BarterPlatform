import { Group, Text, Checkbox } from '@mantine/core';
import type { Subcategory } from '@/entities/taxonomy';

type Props = {
  subcategory: Subcategory;
  selected: boolean;
  onSelect: () => void;
};

export const SubcategoryItem = ({ subcategory, selected, onSelect }: Props) => {
  return (
    <Group
      justify="space-between"
      wrap="nowrap"
      style={{
        borderRadius: 8,
        border: '1px solid var(--mantine-color-gray-2)',
        padding: '4px 10px',
        backgroundColor: selected
          ? 'var(--mantine-color-blue-0)'
          : 'transparent',
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
};
