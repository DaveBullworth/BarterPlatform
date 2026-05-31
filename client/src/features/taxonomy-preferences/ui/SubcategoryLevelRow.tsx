import type { Subcategory } from '@/entities/taxonomy';
import {
  type PreferenceWeight,
} from '@/entities/userPreferences';

import { LevelSelector } from './LevelSelector';
import styles from './TaxonomyPreferencesModal.module.scss';

type Props = {
  subcategory: Subcategory;
  value: PreferenceWeight | null;
  onChange: (next: PreferenceWeight | null) => void;
};

export const SubcategoryLevelRow = ({
  subcategory,
  value,
  onChange,
}: Props) => {
  return (
    <div className={styles.subcategoryRow}>
      <span className={styles.subcategoryName}>{subcategory.name}</span>
      <LevelSelector
        value={value}
        onChange={onChange}
        ariaLabel={subcategory.name}
      />
    </div>
  );
};
