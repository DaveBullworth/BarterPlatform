import { useTranslation } from 'react-i18next';
import { Stack, Select } from '@mantine/core';
import type { ReactNode } from 'react';

import type { GeoSelectOption, GeoValue } from '@/entities/geography';

type Props = {
  value: GeoValue;
  onChange: (value: GeoValue) => void;
  regionOptions: GeoSelectOption[];
  cityOptions: GeoSelectOption[];
  districtOptions: GeoSelectOption[];
  errors?: {
    regionId?: ReactNode;
    cityId?: ReactNode;
  };
};

export const GeoSelector = ({
  value,
  onChange,
  regionOptions,
  cityOptions,
  districtOptions,
  errors,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Stack gap="sm">
      <Select
        label={t('auth.region')}
        placeholder={t('auth.selectRegion')}
        data={regionOptions}
        searchable
        clearable
        value={value.regionId || null}
        error={errors?.regionId}
        onChange={(val) =>
          onChange({ regionId: val ?? '', cityId: '', districtId: '' })
        }
      />

      <Select
        key={`city-${value.regionId || 'empty'}`}
        label={t('auth.city')}
        placeholder={t('auth.selectCity')}
        data={cityOptions}
        searchable
        clearable
        disabled={!value.regionId}
        value={value.cityId || null}
        error={errors?.cityId}
        onChange={(val) =>
          onChange({ ...value, cityId: val ?? '', districtId: '' })
        }
      />

      <Select
        key={`district-${value.cityId || 'empty'}`}
        label={t('auth.district')}
        placeholder={
          !value.cityId
            ? t('auth.cityNotSelected')
            : districtOptions.length === 0
              ? t('profile.missed')
              : t('auth.selectDistrict')
        }
        data={districtOptions}
        searchable
        clearable
        disabled={!value.cityId || districtOptions.length === 0}
        value={value.districtId || null}
        onChange={(val) => onChange({ ...value, districtId: val ?? '' })}
      />
    </Stack>
  );
};
