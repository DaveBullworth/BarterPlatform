import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  startTransition,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Accordion,
  Group,
  TextInput,
  Select,
  MultiSelect,
  Stack,
  Button,
  Indicator,
  Text,
  CloseButton,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { DateRangeDropdownInput } from '@/shared/ui/DateRangeDropdownInput';
import { getCountries } from '@/http/country';
import { setCountries } from '@/store/countriesSlice';
import type { RootState } from '@/store';
import type { Country } from '@/types/country';
import type {
  UserFilters,
  TextOperator,
  TextFilter,
  MultiTextFilter,
} from '@/types/filters';

import styles from '../AdminPage.module.scss';

type Props = {
  value: UserFilters; // applied (внешние) фильтры
  onChange: (filters: UserFilters) => void; // вызывается только при apply/reset
};

type MultiTextFilterInputProps = {
  field: keyof UserFilters;
  filter?: MultiTextFilter;
  options: { value: string; label: string }[];
  loading?: boolean;
  onCommit: (
    field: keyof UserFilters,
    patch: Partial<{ operator: TextOperator; values: string[] }>,
  ) => void;
  t: TFunction;
  placeholder: string;
};

const TEXT_OPERATORS: { value: TextOperator; labelKey: string }[] = [
  { value: 'contains', labelKey: 'admin.filter.contains' },
  { value: 'equals', labelKey: 'admin.filter.equals' },
  { value: 'not_contains', labelKey: 'admin.filter.notContains' },
  { value: 'not_equals', labelKey: 'admin.filter.notEquals' },
];

// ---- утилиты ----
// Стабильная нормализация/стринга для сравнения фильтров (сортировка ключей)
function normalizeForCompare(obj: unknown): unknown {
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(normalizeForCompare);
  }

  const record = obj as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const out: Record<string, unknown> = {};

  for (const k of keys) {
    out[k] = normalizeForCompare(record[k]);
  }

  return out;
}

function filtersEqual(a: unknown, b: unknown): boolean {
  return (
    JSON.stringify(normalizeForCompare(a)) ===
    JSON.stringify(normalizeForCompare(b))
  );
}

// --- компонент одного текстового фильтра ---
// TextFilterInput (debounced local input, async prop sync)
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

    // локальное значение для мгновенной отзывчивости
    const [localValue, setLocalValue] = useState<string>(propValue);

    // асинхронная синхронизация с пропом (не ставим стейт *синхронно* в useEffect)
    useEffect(() => {
      Promise.resolve().then(() => {
        // только если реально отличается — чтобы не трeшить рендеры
        setLocalValue((prev) => (prev === propValue ? prev : propValue));
      });
    }, [propValue]);

    // дебаунс/таймер
    const commitTimer = useRef<number | null>(null);
    useEffect(
      () => () => {
        if (commitTimer.current) {
          clearTimeout(commitTimer.current);
        }
      },
      [],
    );

    const scheduleCommit = useCallback(
      (val: string) => {
        setLocalValue(val);

        if (commitTimer.current) {
          clearTimeout(commitTimer.current);
        }
        // 160-250ms — хороший компромисс
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
          onChange={(op) => {
            // оператор меняем сразу — (можно тоже делать через debounce, но обычно не нужно)
            onCommit(field, {
              operator: (op as TextOperator) ?? 'contains',
              value: localValue,
            });
          }}
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
                // сразу очищаем значение
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
            if (e.key === 'Enter') {
              flushNow();
            }
          }}
        />
      </Group>
    );
  },
  // кастомная shallow-проверка: перерисовывать только если реально поменялось value/operator
  (prev, next) =>
    prev.field === next.field &&
    (prev.filter?.value ?? '') === (next.filter?.value ?? '') &&
    (prev.filter?.operator ?? 'contains') ===
      (next.filter?.operator ?? 'contains') &&
    prev.t === next.t &&
    prev.onCommit === next.onCommit,
);

export const MultiTextFilterInput = React.memo(
  ({
    field,
    filter,
    options,
    loading = false,
    onCommit,
    t,
    placeholder,
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
          nothingFoundMessage={t('admin.filter.noCountries')}
          data={options}
          value={values}
          onChange={(vals) => onCommit(field, { values: vals })}
          maxValues={10}
          disabled={loading}
        />
      </Group>
    );
  },
);

export function AdminTableFilters({ value, onChange }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // получение стран из redux
  const reduxCountries = useSelector(
    (state: RootState) => state.countries.data,
  );

  // состояния для стран
  const [localCountries, setLocalCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState<boolean>(true);

  // localFilters — интерактивное локальное состояние, независящее от внешнего, пока не нажали Apply/Reset.
  // Инициализируем копией value.
  const [localFilters, setLocalFilters] = useState<UserFilters>(() => ({
    ...value,
  }));

  // Load countries — сначала из Redux, если пусто — с сервера
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    if (reduxCountries.length > 0) {
      // откладываем обновление на микротаск
      Promise.resolve().then(() => {
        setLocalCountries(reduxCountries);
        setLoadingCountries(false);
      });
      return;
    }

    getCountries(signal)
      .then((res) => {
        setLocalCountries(res);
        dispatch(setCountries(res));
      })
      .catch((err) => {
        if (err.name === 'CanceledError') return; // axios / fetch abort
        console.error(err);
      })
      .finally(() => setLoadingCountries(false));

    return () => {
      controller.abort(); // отменяем запрос при размонтировании или перезапуске effect
    };
  }, [dispatch, reduxCountries]);

  // Если внешние фильтры (applied) изменились извне — синхронизируем локал,
  // чтобы UI отражал текущее applied состояние (например, при загрузке или внешнем сбросе).
  useEffect(() => {
    // синхронизируем только если реально есть различия
    if (!filtersEqual(localFilters, value)) {
      setLocalFilters({ ...value });
    }
    // deliberately depend on value (applied filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Функция обновления текстового фильтра — использует функциональный setState
  const setTextFilter = useCallback(
    (
      field: keyof UserFilters,
      patch: Partial<{ operator: TextOperator; value: string }>,
    ) => {
      // можно пометить как не срочное:
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
    [setLocalFilters],
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

      // если нет значений — удаляем фильтр
      if (!next.values || next.values.length === 0) {
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
    const values: [Date | null, Date | null] = range;

    setLocalFilters((prev) => {
      if (!values[0] && !values[1]) {
        const rest = { ...prev } as Record<string, unknown>;
        delete rest[field as string];
        return rest as UserFilters;
      }

      return { ...prev, [field]: { type: 'date_range', values } };
    });
  };

  // Сброс локальных фильтров — чистим локально и отправляем внешний пустой набор
  const resetLocalFilters = () => {
    const next: UserFilters = {};
    // если applied (value) уже пуст — не вызываем лишний onChange
    if (!filtersEqual(value, next)) {
      onChange(next);
    }
    setLocalFilters(next);
  };

  // Проверка наличия активных (applied) фильтров — для индикатора
  const activeFiltersCount = useMemo(() => {
    return Object.values(value).filter((f) => f !== undefined && f !== null)
      .length;
  }, [value]);

  const hasActiveFilters = activeFiltersCount > 0;

  // Apply: передаём локальные фильтры наружу, только если они отличаются от applied (value).
  const applyFilters = () => {
    // Нормализуем (удалим пустые/undefined) — в нашем API локальные уже не держат пустые
    if (!filtersEqual(localFilters, value)) {
      onChange(localFilters);
    }
  };

  return (
    <Accordion variant="separated" multiple={false}>
      <Indicator
        color="red"
        offset={5}
        label={activeFiltersCount}
        disabled={!hasActiveFilters}
        size={20}
        position="top-end"
      >
        <Accordion.Item value="filters">
          <Accordion.Control>
            <Text>{t('admin.filter.title')}</Text>
          </Accordion.Control>
          <Accordion.Panel className={styles.filtersPanel}>
            <Stack gap="sm">
              {/* TEXT FILTERS */}
              {(['login', 'name', 'email', 'phone'] as const).map((field) => (
                <TextFilterInput
                  key={field}
                  field={field}
                  filter={localFilters[field] as TextFilter | undefined}
                  onCommit={setTextFilter}
                  t={t}
                />
              ))}

              {/* BOOLEAN FILTERS */}
              <Group grow className={styles.booleanFilter}>
                <Select
                  clearable
                  placeholder={t('admin.filter.role')}
                  data={[
                    { value: 'true', label: t('common.admin') },
                    { value: 'false', label: t('common.user') },
                  ]}
                  // value: string | null
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
                />
              </Group>

              <MultiTextFilterInput
                field="country"
                filter={localFilters.country}
                options={localCountries.map((c) => ({
                  value: c.id,
                  label: t(`countries.${c.abbreviation}`),
                }))}
                loading={loadingCountries}
                onCommit={setMultiFilter}
                t={t}
                placeholder={t('admin.filter.countryPlaceholder')}
              />

              <DateRangeDropdownInput
                label={t('common.createdAt')}
                placeholder={t('admin.filter.createdAtPlaceholder')}
                value={localFilters.createdAt?.values ?? [null, null]}
                onChange={(range) => setDateRangeFilter('createdAt', range)}
              />

              {/* ACTIONS */}
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
