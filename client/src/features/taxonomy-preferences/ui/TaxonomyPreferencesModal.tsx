import { Loader, Modal } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

import { useUserPreferences } from '@/entities/userPreferences';

import { PreferencesContent } from './PreferencesContent';
import styles from './TaxonomyPreferencesModal.module.scss';

type Props = {
  opened: boolean;
  onClose: () => void;
};

export const TaxonomyPreferencesModal = ({ opened, onClose }: Props) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const { data: prefsData, isLoading: prefsLoading } =
    useUserPreferences(opened);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('preferences.modal.title')}
      size="lg"
      fullScreen={isMobile}
      classNames={{
        content: styles.modalContent,
        body: styles.modalBody,
      }}
    >
      {prefsLoading || !prefsData ? (
        <div className={styles.loaderBox}>
          <Loader size="sm" color="barter" />
        </div>
      ) : (
        <PreferencesContent initialItems={prefsData.items} onClose={onClose} />
      )}
    </Modal>
  );
};
