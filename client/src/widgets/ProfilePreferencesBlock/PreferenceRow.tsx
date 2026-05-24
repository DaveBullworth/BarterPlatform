import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { Tooltip } from '@mantine/core';

import styles from './ProfilePreferencesBlock.module.scss';

type PreferenceRowProps = {
  icon: ReactNode;
  label: string;
  isOutdated: boolean;
  control: ReactNode;
};

export const PreferenceRow = ({
  icon,
  label,
  isOutdated,
  control,
}: PreferenceRowProps) => {
  const { t } = useTranslation();

  const cardClass = [
    styles.preferenceCard,
    isOutdated ? styles.preferenceCardOutdated : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass}>
      <span className={styles.iconTile}>{icon}</span>
      <div className={styles.body}>
        <div className={styles.label}>
          <span>{label}</span>
          {isOutdated && (
            <Tooltip
              label={t('profile.settingMissmatch')}
              withArrow
              position="top"
              multiline
              w={240}
            >
              <span
                className={styles.outdatedDot}
                role="status"
                aria-label="unsaved"
              />
            </Tooltip>
          )}
        </div>
        {control}
      </div>
    </div>
  );
};
