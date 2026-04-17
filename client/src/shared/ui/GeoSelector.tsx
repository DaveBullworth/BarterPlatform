import { Stack, Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

export type GeoValue = {
  regionId: string;
  cityId: string;
  districtId: string;
};

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  value: GeoValue;
  onChange: (value: GeoValue) => void;

  regionOptions: SelectOption[];
  cityOptions: SelectOption[];
  districtOptions: SelectOption[];

  onRegionChange: (value: string | null) => void;
  onCityChange: (value: string | null) => void;

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
  onRegionChange,
  onCityChange,
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
        value={value.regionId}
        error={errors?.regionId}
        onChange={(val) => {
          onRegionChange(val);

          onChange({
            regionId: val || '',
            cityId: '',
            districtId: '',
          });
        }}
      />

      <Select
        key={`city-${value.regionId || 'empty'}`}
        label={t('auth.city')}
        placeholder={t('auth.selectCity')}
        data={cityOptions}
        searchable
        clearable
        disabled={!value.regionId}
        value={value.cityId}
        error={errors?.cityId}
        onChange={(val) => {
          onCityChange(val);

          onChange({
            ...value,
            cityId: val || '',
            districtId: '',
          });
        }}
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
        value={value.districtId}
        onChange={(val) =>
          onChange({
            ...value,
            districtId: val || '',
          })
        }
      />
    </Stack>
  );
};
