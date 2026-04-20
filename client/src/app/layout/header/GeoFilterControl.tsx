import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Button, Group, Modal, Stack } from '@mantine/core';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getCities, getDistricts, getRegions } from '@/http/geography';
import { GeoSelector } from '@/shared/ui/GeoSelector';
import {
  EMPTY_GEO_FILTER,
  GEO_FILTER_CHANGED_EVENT,
  GEO_FILTER_STORAGE_KEY,
  readStoredGeoFilter,
  type GeoFilterStorageValue,
} from '@/shared/utils/geoFilter';
import type { CityOption, DistrictOption, RegionOption } from '@/types/geo.dto';

type GeoFilterValues = GeoFilterStorageValue;

const hasSelectedGeo = (values: GeoFilterValues) =>
  Boolean(values.regionId || values.cityId || values.districtId);

export const GeoFilterControl = () => {
  const { t } = useTranslation();

  const [opened, setOpened] = useState(false);
  const [appliedFilter, setAppliedFilter] =
    useState<GeoFilterValues>(readStoredGeoFilter);
  const [draftFilter, setDraftFilter] =
    useState<GeoFilterValues>(readStoredGeoFilter);

  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);

  useEffect(() => {
    getRegions().then(setRegions).catch(console.error);
  }, []);

  useEffect(() => {
    if (appliedFilter.regionId) {
      getCities(Number(appliedFilter.regionId))
        .then(setCities)
        .catch(console.error);
    }

    if (appliedFilter.cityId) {
      getDistricts(Number(appliedFilter.cityId))
        .then(setDistricts)
        .catch(console.error);
    }
  }, [appliedFilter.cityId, appliedFilter.regionId]);

  const regionOptions = useMemo(
    () =>
      [...regions]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((region) => ({ value: String(region.id), label: region.name })),
    [regions],
  );

  const cityOptions = useMemo(
    () =>
      [...cities]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((city) => ({ value: String(city.id), label: city.name })),
    [cities],
  );

  const districtOptions = useMemo(
    () =>
      [...districts]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((district) => ({
          value: String(district.id),
          label: district.name,
        })),
    [districts],
  );

  const onOpen = () => {
    setDraftFilter(appliedFilter);
    setOpened(true);
  };

  const handleRegionChange = (value: string | null) => {
    const regionId = value || '';

    setDraftFilter({
      regionId,
      cityId: '',
      districtId: '',
    });

    setCities([]);
    setDistricts([]);

    if (regionId) {
      getCities(Number(regionId)).then(setCities).catch(console.error);
    }
  };

  const handleCityChange = (value: string | null) => {
    const cityId = value || '';

    setDraftFilter((prev) => ({
      ...prev,
      cityId,
      districtId: '',
    }));

    setDistricts([]);

    if (cityId) {
      getDistricts(Number(cityId)).then(setDistricts).catch(console.error);
    }
  };

  const handleSave = () => {
    setAppliedFilter(draftFilter);

    if (hasSelectedGeo(draftFilter)) {
      localStorage.setItem(GEO_FILTER_STORAGE_KEY, JSON.stringify(draftFilter));
    } else {
      localStorage.removeItem(GEO_FILTER_STORAGE_KEY);
    }

    window.dispatchEvent(new Event(GEO_FILTER_CHANGED_EVENT));
    setOpened(false);
  };

  const handleReset = () => {
    setDraftFilter(EMPTY_GEO_FILTER);
    setAppliedFilter(EMPTY_GEO_FILTER);
    setCities([]);
    setDistricts([]);
    localStorage.removeItem(GEO_FILTER_STORAGE_KEY);
    window.dispatchEvent(new Event(GEO_FILTER_CHANGED_EVENT));
  };

  const hasAppliedFilter = hasSelectedGeo(appliedFilter);

  return (
    <>
      <ActionIcon
        variant={hasAppliedFilter ? 'filled' : 'light'}
        color={hasAppliedFilter ? 'red' : undefined}
        size="lg"
        onClick={onOpen}
        aria-label={t('header.geoFilter')}
      >
        <MapPin size={18} />
      </ActionIcon>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('header.geoFilter')}
        centered
      >
        <Stack gap="sm">
          <GeoSelector
            value={draftFilter}
            onChange={setDraftFilter}
            regionOptions={regionOptions}
            cityOptions={cityOptions}
            districtOptions={districtOptions}
            onRegionChange={handleRegionChange}
            onCityChange={handleCityChange}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={handleReset}>
              {t('categories.reset')}
            </Button>
            <Button variant="default" onClick={() => setOpened(false)}>
              {t('auth.close')}
            </Button>
            <Button onClick={handleSave}>{t('common.save')}</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
