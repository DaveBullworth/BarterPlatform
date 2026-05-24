import { Checkbox } from '@mantine/core';

import type { Subcategory } from '@/entities/taxonomy';

import styles from '../Taxonomy.module.scss';

type Props = {
  subcategory: Subcategory;
  selected: boolean;
  onSelect: () => void;
};

export const SubcategoryItem = ({ subcategory, selected, onSelect }: Props) => {
  const className = [
    styles.subcategory,
    selected ? styles.subcategorySelected : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      onClick={onSelect}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span className={styles.subcategoryName}>{subcategory.name}</span>
      <Checkbox
        color="barter"
        checked={selected}
        onChange={onSelect}
        onClick={(e) => e.stopPropagation()}
        aria-label={subcategory.name}
        tabIndex={-1}
      />
    </div>
  );
};
