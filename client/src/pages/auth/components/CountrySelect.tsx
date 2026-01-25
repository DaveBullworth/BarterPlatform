import { Autocomplete, Group, Image, Text, Loader } from '@mantine/core';
import { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { Country } from '@/types/country';
import { getCountries } from '@/http/country';
import { setCountries } from '@/store/countriesSlice';
import type { RootState } from '@/store';
import { debounce } from 'lodash';

import styles from '../AuthPage.module.scss';

const STATIC_URL = import.meta.env.VITE_API_URL;

interface Props {
  value: string | null;
  onChange: (country: Country | null) => void;
}

interface CountryAutocompleteItem {
  value: string;
  label: string;
  iconPath?: string;
}

const CountrySelect = ({ value, onChange }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const reduxCountries = useSelector(
    (state: RootState) => state.countries.data,
  );

  const [countries, setLocalCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const handleDebouncedSearch = useMemo(
    () => debounce((val: string) => setDebouncedSearch(val), 300),
    [],
  );

  useEffect(() => {
    handleDebouncedSearch(search);
  }, [search, handleDebouncedSearch]);

  // Load countries — сначала из Redux, если пусто — с сервера
  useEffect(() => {
    if (reduxCountries.length > 0) {
      // откладываем обновление на микротаск
      Promise.resolve().then(() => {
        setLocalCountries(reduxCountries);
        setLoading(false);
      });
      return;
    }

    getCountries()
      .then((res) => {
        setLocalCountries(res);
        dispatch(setCountries(res));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dispatch, reduxCountries]);

  // Selected country name
  useEffect(() => {
    const selected = countries.find((c) => c.id === value);
    if (selected) {
      Promise.resolve().then(() => {
        setSearch(t(`countries.${selected.abbreviation}`));
      });
    }
  }, [value, countries, t]);

  const data: CountryAutocompleteItem[] = useMemo(
    () =>
      countries.map((c) => ({
        value: c.id,
        label: t(`countries.${c.abbreviation}`),
        iconPath: c.iconPath ?? undefined,
      })),
    [countries, t],
  );

  const filteredData = useMemo(
    () =>
      data.filter((c) =>
        c.label.toLowerCase().includes(debouncedSearch.toLowerCase()),
      ),
    [data, debouncedSearch],
  );

  return (
    <Autocomplete
      label={t('auth.country')}
      placeholder={t('auth.selectCountry')}
      value={search}
      disabled={loading}
      onChange={(val) => {
        if (val.length <= 50) {
          setSearch(val);
          if (value) onChange(null);
        }
      }}
      onOptionSubmit={(val: string) => {
        const country = countries.find((c) => c.id === val) ?? null;
        onChange(country);
        setSearch(val);
      }}
      data={filteredData}
      rightSection={loading ? <Loader size="xs" /> : null}
      leftSection={
        value
          ? (() => {
              const selected = countries.find((c) => c.id === value);
              if (!selected || !selected.iconPath) return null;
              return (
                <div className={styles.country_image_container}>
                  <Image
                    src={`${STATIC_URL}${selected.iconPath}`}
                    w={25}
                    h={25}
                    radius="lg"
                    fit="contain"
                    className={styles.country_image}
                  />
                </div>
              );
            })()
          : null
      }
      leftSectionWidth={'3rem'}
      maxDropdownHeight={320}
      comboboxProps={{ transitionProps: { transition: 'pop', duration: 200 } }}
      renderOption={({ option, ...props }) => {
        const opt = option as CountryAutocompleteItem;
        const isSelected = opt.value === value;
        return (
          <div {...props}>
            <Group gap="sm" align="center">
              {opt.iconPath && (
                <div className={styles.country_image_container}>
                  <Image
                    src={`${STATIC_URL}${opt.iconPath}`}
                    w={25}
                    h={25}
                    radius="lg"
                    fit="contain"
                    className={styles.country_image}
                  />
                </div>
              )}
              <Text fw={isSelected ? 700 : 400} size="sm">
                {opt.label}
              </Text>
            </Group>
          </div>
        );
      }}
      classNames={{ input: styles.countryAutocompleteInput }}
      data-has-value={!!value} // добавляем атрибут для селектора
    />
  );
};

export default CountrySelect;
