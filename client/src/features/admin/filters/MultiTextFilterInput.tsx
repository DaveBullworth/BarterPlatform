import { Group, Loader, MultiSelect, Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { MultiTextFilter, TextOperator } from '@/shared/lib/filters';

import styles from './AdminFilters.module.scss';

type Props = {
  filter?: MultiTextFilter;
  options: { value: string; label: string }[];
  onCommit: (filter: MultiTextFilter | undefined) => void;
  placeholder: string;
  loading?: boolean;
  onDropdownOpen?: () => void;
};

export const MultiTextFilterInput = ({
  filter,
  options,
  onCommit,
  placeholder,
  loading,
  onDropdownOpen,
}: Props) => {
  const { t } = useTranslation();
  const values = filter?.values ?? [];
  const operator = filter?.operator ?? 'contains';

  const handleValuesChange = (vals: string[]) => {
    if (vals.length === 0) {
      onCommit(undefined);
    } else {
      onCommit({ type: 'multi_text', operator, values: vals });
    }
  };

  const handleOperatorChange = (op: string | null) => {
    if (values.length === 0) return;
    onCommit({
      type: 'multi_text',
      operator: (op as TextOperator) ?? 'contains',
      values,
    });
  };

  return (
    <Group grow className={styles.textFilter}>
      <Select
        placeholder={t('admin.selectOperator')}
        data={[
          { value: 'contains', label: t('admin.filter.contains') },
          { value: 'not_contains', label: t('admin.filter.notContains') },
        ]}
        value={operator}
        onChange={handleOperatorChange}
        disabled={values.length === 0}
      />

      <MultiSelect
        rightSection={loading ? <Loader size="xs" /> : null}
        searchable
        clearable
        placeholder={loading ? t('common.loading') : placeholder}
        data={options}
        value={values}
        onChange={handleValuesChange}
        onDropdownOpen={onDropdownOpen}
        maxValues={20}
      />
    </Group>
  );
};
