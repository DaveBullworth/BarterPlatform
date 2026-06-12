import { useState, useRef, useCallback } from 'react';
import { Group, Select, TextInput, CloseButton } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { TextFilter, TextOperator } from '@/shared/lib/filters';

import styles from './AdminFilters.module.scss';

const TEXT_OPERATORS: { value: TextOperator; labelKey: string }[] = [
  { value: 'contains', labelKey: 'admin.filter.contains' },
  { value: 'equals', labelKey: 'admin.filter.equals' },
  { value: 'not_contains', labelKey: 'admin.filter.notContains' },
  { value: 'not_equals', labelKey: 'admin.filter.notEquals' },
];

// Лимиты совпадают с валидацией соответствующих полей на сервере.
const FIELD_MAX_LENGTH: Record<string, number> = {
  login: 60,
  name: 200,
  email: 200,
  phone: 11,
};

type Props = {
  fieldKey: string;
  filter?: TextFilter;
  onCommit: (filter: TextFilter | undefined) => void;
};

export const TextFilterInput = ({ fieldKey, filter, onCommit }: Props) => {
  const { t } = useTranslation();
  const operator = filter?.operator ?? 'contains';
  const [localValue, setLocalValue] = useState(filter?.value ?? '');
  const timerRef = useRef<number | null>(null);

  const commit = useCallback(
    (value: string, op: TextOperator) => {
      if (!value.trim()) {
        onCommit(undefined);
      } else {
        onCommit({ type: 'text', operator: op, value });
      }
    },
    [onCommit],
  );

  const scheduleCommit = useCallback(
    (raw: string) => {
      // Телефон хранится цифрами — нецифровые символы в фильтре бессмысленны.
      const value = fieldKey === 'phone' ? raw.replace(/\D/g, '') : raw;
      setLocalValue(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        commit(value, operator);
      }, 200);
    },
    [commit, operator, fieldKey],
  );

  const handleClear = () => {
    setLocalValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onCommit(undefined);
  };

  return (
    <Group grow className={styles.textFilter}>
      <Select
        placeholder={t('admin.selectOperator')}
        data={TEXT_OPERATORS.map((op) => ({
          value: op.value,
          label: t(op.labelKey),
        }))}
        value={operator}
        onChange={(op) =>
          commit(localValue, (op as TextOperator) ?? 'contains')
        }
        disabled={!localValue.trim()}
      />

      <TextInput
        placeholder={t(`admin.filter.${fieldKey}`)}
        value={localValue}
        maxLength={FIELD_MAX_LENGTH[fieldKey] ?? 200}
        onChange={(e) => scheduleCommit(e.currentTarget.value)}
        onBlur={() => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            commit(localValue, operator);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (timerRef.current) clearTimeout(timerRef.current);
            commit(localValue, operator);
          }
        }}
        rightSection={
          localValue ? (
            <CloseButton onClick={handleClear} aria-label="Clear" />
          ) : null
        }
      />
    </Group>
  );
};
