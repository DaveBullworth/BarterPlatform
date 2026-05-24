import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './ProfileContactsBlock.module.scss';

type InfoRowProps = {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  /** Полная ширина — занять оба столбца grid'а. */
  fullWidth?: boolean;
  /** Цветовая акцентуация иконки. */
  accent?: 'default' | 'barter' | 'success' | 'warning' | 'danger';
};

/**
 * Info-карточка для блоков профиля.
 * Tile-стиль: иконка слева, label + value справа. На пустом значении
 * показывает приглушённый placeholder "missed".
 */
export const InfoRow = ({
  icon,
  label,
  value,
  fullWidth = false,
  accent = 'default',
}: InfoRowProps) => {
  const { t } = useTranslation();

  const tileClass = [
    styles.iconTile,
    accent === 'barter' && styles.iconTileBarter,
    accent === 'success' && styles.iconTileSuccess,
    accent === 'warning' && styles.iconTileWarning,
    accent === 'danger' && styles.iconTileDanger,
  ]
    .filter(Boolean)
    .join(' ');

  const cardClass = [styles.card, fullWidth ? styles.contactsBlockFull : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass}>
      <span className={tileClass}>{icon}</span>
      <div className={styles.body}>
        <span className={styles.label}>{label}</span>
        {value ? (
          <span className={styles.value}>{value}</span>
        ) : (
          <span className={`${styles.value} ${styles.valueMuted}`}>
            {t('profile.missed')}
          </span>
        )}
      </div>
    </div>
  );
};
