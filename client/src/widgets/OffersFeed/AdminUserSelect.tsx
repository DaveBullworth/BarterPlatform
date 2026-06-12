import { useMemo, useState } from 'react';
import { Select, Loader } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

import { useUserSearch } from '@/entities/user';

type Option = { value: string; label: string };

type Props = {
  value: string | null;
  onChange: (userId: string | null) => void;
};

/**
 * ADMIN-селект «смотреть предложения от лица пользователя»: поиск по
 * name/login/email с дебаунсом. Выбранная опция удерживается в data, чтобы её
 * подпись отображалась после выбора.
 */
export const AdminUserSelect = ({ value, onChange }: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [debounced] = useDebouncedValue(search, 300);
  const [selected, setSelected] = useState<Option | null>(null);

  const { data: results = [], isFetching } = useUserSearch(debounced);

  const data = useMemo<Option[]>(() => {
    const options = results.map((u) => ({
      value: u.id,
      label: `${u.name} · ${u.login}`,
    }));
    if (selected && !options.some((o) => o.value === selected.value)) {
      options.unshift(selected);
    }
    return options;
  }, [results, selected]);

  return (
    <Select
      w={{ base: '100%', sm: 260 }}
      size="sm"
      searchable
      clearable
      placeholder={t('offers.admin.viewAs')}
      nothingFoundMessage={
        debounced ? t('offers.admin.notFound') : t('offers.admin.typeToSearch')
      }
      data={data}
      value={value}
      searchValue={search}
      onSearchChange={(val) => setSearch(val.slice(0, 200))}
      rightSection={isFetching ? <Loader size="xs" /> : undefined}
      onChange={(val) => {
        setSelected(data.find((o) => o.value === val) ?? null);
        onChange(val);
      }}
    />
  );
};
