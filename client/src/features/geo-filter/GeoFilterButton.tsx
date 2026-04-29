import { ActionIcon } from '@mantine/core';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GeoFilterModal } from './GeoFilterModal';
import { useGeoFilter } from './useGeoFilter';

export const GeoFilterButton = () => {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const { filter, hasFilter, apply, reset } = useGeoFilter();

  return (
    <>
      <ActionIcon
        variant={hasFilter ? 'filled' : 'light'}
        color={hasFilter ? 'red' : undefined}
        size="lg"
        onClick={() => setOpened(true)}
        aria-label={t('header.geoFilter')}
      >
        <MapPin size={18} />
      </ActionIcon>

      <GeoFilterModal
        opened={opened}
        onClose={() => setOpened(false)}
        value={filter}
        onApply={apply}
        onReset={reset}
      />
    </>
  );
};
