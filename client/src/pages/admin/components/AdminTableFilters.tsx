import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  startTransition,
} from 'react';
import {
  Accordion,
  Group,
  TextInput,
  Select,
  Stack,
  Button,
  Indicator,
  Text,
  CloseButton,
  MultiSelect,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useDispatch, useSelector } from 'react-redux';

import { DateRangeDropdownInput } from '@/shared/ui/DateRangeDropdownInput';
import type {
  UserFilters,
  TextOperator,
  TextFilter,
  MultiTextFilter,
} from '@/types/filters';
import type { AppDispatch } from '@/store';
import {
  fetchCitiesIfNeeded,
  fetchDistrictsIfNeeded,
  fetchRegionsIfNeeded,
  selectCities,
  selectDistricts,
  selectRegions,
} from '@/store/geographySlice';

import styles from '../AdminPage.module.scss';

type Props = {
  value: UserFilters;
  onChange: (filters: UserFilters) => void;
};

type MultiTextFilterInputProps = {
  field: keyof UserFilters;
  filter?: MultiTextFilter;
  options: { value: string; label: string }[];
  onCommit: (
    field: keyof UserFilters,
    patch: Partial<{ operator: TextOperator; values: string[] }>,
  ) => void;
  t: TFunction;
  placeholder: string;
  onDropdownOpen?: () => void;
};

const TEXT_OPERATORS: { value: TextOperator; labelKey: string }[] = [
  { value: 'contains', labelKey: 'admin.filter.contains' },
  { value: 'equals', labelKey: 'admin.filter.equals' },
  { value: 'not_contains', labelKey: 'admin.filter.notContains' },
  { value: 'not_equals', labelKey: 'admin.filter.notEquals' },
];

function normalizeForCompare(obj: unknown): unknown {
  if (obj instanceof Date) return obj.toISOString();
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(normalizeForCompare);
  const record = obj as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = normalizeForCompare(record[k]);
  return out;
}

function filtersEqual(a: unknown, b: unknown): boolean {
  return (
    JSON.stringify(normalizeForCompare(a)) ===
    JSON.stringify(normalizeForCompare(b))
  );
}

export const TextFilterInput = React.memo(
  ({
    field,
    filter,
    onCommit,
    t,
  }: {
    field: keyof UserFilters;
    filter?: TextFilter;
    onCommit: (
      field: keyof UserFilters,
      patch: Partial<{ value: string; operator: TextOperator }>,
    ) => void;
    t: TFunction;
  }) => {
    const propValue = filter?.value ?? '';
    const propOperator = (filter?.operator ?? 'contains') as TextOperator;
    const [localValue, setLocalValue] = useState<string>(propValue);

    useEffect(() => {
      Promise.resolve().then(() => {
        setLocalValue((prev) => (prev === propValue ? prev : propValue));
      });
    }, [propValue]);

    const commitTimer = useRef<number | null>(null);
    useEffect(
      () => () => {
        if (commitTimer.current) clearTimeout(commitTimer.current);
      },
      [],
    );

    const scheduleCommit = useCallback(
      (val: string) => {
        setLocalValue(val);
        if (commitTimer.current) clearTimeout(commitTimer.current);
        commitTimer.current = window.setTimeout(() => {
          commitTimer.current = null;
          onCommit(field, { value: val, operator: propOperator });
        }, 200);
      },
      [field, onCommit, propOperator],
    );

    const flushNow = useCallback(() => {
      if (commitTimer.current) {
        clearTimeout(commitTimer.current);
        commitTimer.current = null;
      }
      onCommit(field, { value: localValue, operator: propOperator });
    }, [field, localValue, onCommit, propOperator]);

    const selectDisabled = localValue.trim() === '';

    return (
      <Group grow className={styles.textFilter}>
        <Select
          placeholder={t(`admin.selectOperator`)}
          data={TEXT_OPERATORS.map((op) => ({
            value: op.value,
            label: t(op.labelKey),
          }))}
          value={propOperator as unknown as string}
          onChange={(op) =>
            onCommit(field, {
              operator: (op as TextOperator) ?? 'contains',
              value: localValue,
            })
          }
          disabled={selectDisabled}
        />

        <TextInput
          placeholder={t(`admin.filter.${String(field)}`)}
          value={localValue}
          onChange={(e) => scheduleCommit(e.currentTarget.value)}
          rightSection={
            <CloseButton
              aria-label="Clear input"
              onClick={() => {
                setLocalValue('');
                if (commitTimer.current) {
                  clearTimeout(commitTimer.current);
                  commitTimer.current = null;
                }
                onCommit(field, { value: '', operator: propOperator });
              }}
              style={{ display: localValue ? undefined : 'none' }}
            />
          }
          onBlur={() => flushNow()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') flushNow();
          }}
        />
      </Group>
    );
  },
);

export const MultiTextFilterInput = React.memo(
  ({
    field,
    filter,
    options,
    onCommit,
    t,
    placeholder,
    onDropdownOpen,
  }: MultiTextFilterInputProps) => {
    const values = filter?.values ?? [];
    const operator = (filter?.operator ?? 'contains') as TextOperator;
    const operatorDisabled = values.length === 0;

    return (
      <Group grow className={styles.textFilter}>
        <Select
          placeholder={t('admin.selectOperator')}
          data={[
            { value: 'contains', label: t('admin.filter.contains') },
            { value: 'not_contains', label: t('admin.filter.notContains') },
          ]}
          value={operator}
          onChange={(op) =>
            onCommit(field, {
              operator: (op as TextOperator) ?? 'contains',
              values,
            })
          }
          disabled={operatorDisabled}
        />

        <MultiSelect
          searchable
          clearable
          placeholder={placeholder}
          data={options}
          value={values}
          onChange={(vals) => onCommit(field, { values: vals })}
          onDropdownOpen={onDropdownOpen}
          maxValues={20}
        />
      </Group>
    );
  },
);

export function AdminTableFilters({ value, onChange }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const regions = useSelector(selectRegions);
  const cities = useSelector(selectCities);
  const districts = useSelector(selectDistricts);

  const [localFilters, setLocalFilters] = useState<UserFilters>(() => ({
    ...value,
  }));

  useEffect(() => {
    if (!filtersEqual(localFilters, value)) setLocalFilters({ ...value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const setTextFilter = useCallback(
    (
      field: keyof UserFilters,
      patch: Partial<{ operator: TextOperator; value: string }>,
    ) => {
      startTransition(() => {
        setLocalFilters((prev) => {
          const prevFilter = prev[field] as TextFilter | undefined;
          const next: TextFilter = {
            type: 'text',
            operator: patch.operator ?? prevFilter?.operator ?? 'contains',
            value: patch.value ?? prevFilter?.value ?? '',
          };

          if (!next.value) {
            const rest = { ...prev } as Record<string, unknown>;
            delete rest[field as string];
            return rest as UserFilters;
          }

          return { ...prev, [field]: next };
        });
      });
    },
    [],
  );

  const setBooleanFilter = (field: keyof UserFilters, val: boolean | null) => {
    setLocalFilters((prev) => {
      if (val === null) {
        const rest = { ...prev } as Record<string, unknown>;
        delete rest[field as string];
        return rest as UserFilters;
      }
      return { ...prev, [field]: { type: 'boolean', value: val } };
    });
  };

  const setMultiFilter = (
    field: keyof UserFilters,
    patch: Partial<{ operator: TextOperator; values: string[] }>,
  ) => {
    setLocalFilters((prev) => {
      const prevFilter = prev[field] as MultiTextFilter | undefined;
      const next: MultiTextFilter = {
        type: 'multi_text',
        operator: patch.operator ?? prevFilter?.operator ?? 'contains',
        values: patch.values ?? prevFilter?.values ?? [],
      };

      if (!next.values.length) {
        const rest = { ...prev } as Record<string, unknown>;
        delete rest[field as string];
        return rest as UserFilters;
      }

      return { ...prev, [field]: next };
    });
  };

  const setDateRangeFilter = (
    field: keyof UserFilters,
    range: [Date | null, Date | null],
  ) => {
    setLocalFilters((prev) => {
      if (!range[0] && !range[1]) {
        const rest = { ...prev } as Record<string, unknown>;
        delete rest[field as string];
        return rest as UserFilters;
      }
      return { ...prev, [field]: { type: 'date_range', values: range } };
    });
  };

  const resetLocalFilters = () => {
    const next: UserFilters = {};
    if (!filtersEqual(value, next)) onChange(next);
    setLocalFilters(next);
  };

  const activeFiltersCount = useMemo(
    () =>
      Object.values(value).filter((f) => f !== undefined && f !== null).length,
    [value],
  );

  const applyFilters = () => {
    if (!filtersEqual(localFilters, value)) onChange(localFilters);
  };

  return (
    <Accordion variant="separated" multiple={false}>
      <Indicator
        color="red"
        offset={5}
        label={activeFiltersCount}
        disabled={activeFiltersCount === 0}
        size={20}
        position="top-end"
      >
        <Accordion.Item value="filters">
          <Accordion.Control>
            <Text>{t('admin.filter.title')}</Text>
          </Accordion.Control>
          <Accordion.Panel className={styles.filtersPanel}>
            <Stack gap="sm">
              {(['login', 'name', 'email', 'phone'] as const).map((field) => (
                <TextFilterInput
                  key={field}
                  field={field}
                  filter={localFilters[field] as TextFilter | undefined}
                  onCommit={setTextFilter}
                  t={t}
                />
              ))}

              <MultiTextFilterInput
                field="region"
                filter={localFilters.region}
                options={[...regions]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((r) => ({ value: String(r.id), label: r.name }))}
                onCommit={setMultiFilter}
                t={t}
                placeholder={t('auth.region')}
                onDropdownOpen={() => dispatch(fetchRegionsIfNeeded())}
              />

              <MultiTextFilterInput
                field="city"
                filter={localFilters.city}
                options={[...cities]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((с) => ({ value: String(с.id), label: с.name }))}
                onCommit={setMultiFilter}
                t={t}
                placeholder={t('auth.city')}
                onDropdownOpen={() => dispatch(fetchCitiesIfNeeded())}
              />

              <MultiTextFilterInput
                field="district"
                filter={localFilters.district}
                options={[...districts]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((d) => {
                    const city = cities.find((c) => c.id === d.cityId);
                    return {
                      value: String(d.id),
                      label: city ? `${d.name} (${city.name})` : d.name,
                    };
                  })}
                onCommit={setMultiFilter}
                t={t}
                placeholder={t('auth.district')}
                onDropdownOpen={() => dispatch(fetchDistrictsIfNeeded())}
              />

              <Group grow className={styles.booleanFilter}>
                <Select
                  clearable
                  placeholder={t('admin.filter.role')}
                  data={[
                    { value: 'true', label: t('common.admin') },
                    { value: 'false', label: t('common.user') },
                  ]}
                  value={
                    localFilters.role === undefined
                      ? null
                      : String(localFilters.role.value)
                  }
                  onChange={(val) =>
                    setBooleanFilter(
                      'role',
                      val === null ? null : val === 'true',
                    )
                  }
                />

                <Select
                  clearable
                  placeholder={t('admin.filter.status')}
                  data={[
                    { value: 'true', label: t('common.active') },
                    { value: 'false', label: t('common.noActive') },
                  ]}
                  value={
                    localFilters.status === undefined
                      ? null
                      : String(localFilters.status.value)
                  }
                  onChange={(val) =>
                    setBooleanFilter(
                      'status',
                      val === null ? null : val === 'true',
                    )
                  }
                  comboboxProps={{ withinPortal: false }}
                />
              </Group>

              <DateRangeDropdownInput
                label={t('common.createdAt')}
                placeholder={t('admin.filter.createdAtPlaceholder')}
                value={localFilters.createdAt?.values ?? [null, null]}
                onChange={(range) => setDateRangeFilter('createdAt', range)}
              />

              <Group className={styles.filterAction}>
                <Button variant="subtle" onClick={resetLocalFilters}>
                  {t('admin.filter.reset')}
                </Button>
                <Button onClick={applyFilters}>
                  {t('admin.filter.apply')}
                </Button>
              </Group>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Indicator>
    </Accordion>
  );
}
