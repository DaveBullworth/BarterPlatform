import {
  Accordion,
  Button,
  Group,
  Indicator,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

import {
  useRegionOptions,
  useAllCityOptions,
  useAllDistrictOptions,
} from '@/entities/geography';
import { DateRangeDropdownInput } from '@/shared/ui';
import type { UserFilters } from '@/entities/user';
import type { TextFilter } from '@/shared/lib/filters';

import { TextFilterInput } from './TextFilterInput';
import { MultiTextFilterInput } from './MultiTextFilterInput';

import styles from './AdminFilters.module.scss';

type Props = {
  local: UserFilters;
  onChange: (filters: UserFilters) => void;
  activeCount: number;
  onApply: () => void;
  onReset: () => void;
};

const TEXT_FIELDS = ['login', 'name', 'email', 'phone'] as const;

export const AdminTableFilters = ({
  local,
  onChange,
  activeCount,
  onApply,
  onReset,
}: Props) => {
  const { t } = useTranslation();

  // Geography для multi-selects: фильтры комбинируются через OR на сервере,
  // поэтому показываем полные списки без каскадной фильтрации.
  const regionOptions = useRegionOptions();
  const cityOptions = useAllCityOptions();
  const districtOptions = useAllDistrictOptions();

  const setField = <K extends keyof UserFilters>(
    field: K,
    value: UserFilters[K] | undefined,
  ) => {
    const next = { ...local };
    if (value === undefined) {
      delete next[field];
    } else {
      next[field] = value;
    }
    onChange(next);
  };

  return (
    <Accordion variant="separated" multiple={false}>
      <Indicator
        color="red"
        offset={5}
        label={activeCount}
        disabled={activeCount === 0}
        size={20}
        position="top-end"
      >
        <Accordion.Item value="filters">
          <Accordion.Control>
            <Text>{t('admin.filter.title')}</Text>
          </Accordion.Control>
          <Accordion.Panel className={styles.filtersPanel}>
            <Stack gap="sm">
              {TEXT_FIELDS.map((field) => (
                <TextFilterInput
                  key={field}
                  fieldKey={field}
                  filter={local[field] as TextFilter | undefined}
                  onCommit={(filter) => setField(field, filter)}
                />
              ))}

              <MultiTextFilterInput
                filter={local.region}
                options={regionOptions}
                onCommit={(filter) => setField('region', filter)}
                placeholder={t('auth.region')}
              />

              <MultiTextFilterInput
                filter={local.city}
                options={cityOptions}
                onCommit={(filter) => setField('city', filter)}
                placeholder={t('auth.city')}
              />

              <MultiTextFilterInput
                filter={local.district}
                options={districtOptions}
                onCommit={(filter) => setField('district', filter)}
                placeholder={t('auth.district')}
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
                    local.role !== undefined ? String(local.role.value) : null
                  }
                  onChange={(val) =>
                    setField(
                      'role',
                      val === null
                        ? undefined
                        : { type: 'boolean', value: val === 'true' },
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
                    local.status !== undefined
                      ? String(local.status.value)
                      : null
                  }
                  onChange={(val) =>
                    setField(
                      'status',
                      val === null
                        ? undefined
                        : { type: 'boolean', value: val === 'true' },
                    )
                  }
                />
              </Group>

              <DateRangeDropdownInput
                label={t('common.createdAt')}
                placeholder={t('admin.filter.createdAtPlaceholder')}
                value={local.createdAt?.values ?? [null, null]}
                onChange={(range) =>
                  setField(
                    'createdAt',
                    !range[0] && !range[1]
                      ? undefined
                      : { type: 'date_range', values: range },
                  )
                }
              />

              <Group className={styles.filterAction}>
                <Button variant="subtle" onClick={onReset}>
                  {t('admin.filter.reset')}
                </Button>
                <Button onClick={onApply}>{t('admin.filter.apply')}</Button>
              </Group>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Indicator>
    </Accordion>
  );
};
