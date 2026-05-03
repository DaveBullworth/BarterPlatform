import { Modal } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { GeoFilterForm } from './GeoFilterForm';
import type { GeoFilterValue } from '@/shared/lib';

type Props = {
  opened: boolean;
  onClose: () => void;
  value: GeoFilterValue;
  onApply: (value: GeoFilterValue) => void;
  onReset: () => void;
};

export const GeoFilterModal = ({
  opened,
  onClose,
  value,
  onApply,
  onReset,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('header.geoFilter')}
      centered
    >
      {opened && (
        <GeoFilterForm
          key={JSON.stringify(value)}
          initialValue={value}
          onApply={(draft) => {
            onApply(draft);
            onClose();
          }}
          onReset={() => {
            onReset();
            onClose();
          }}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};
