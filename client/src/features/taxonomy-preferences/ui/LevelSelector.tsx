import { Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import {
  PREFERENCE_WEIGHTS,
  type PreferenceWeight,
} from '@/entities/userPreferences';

import styles from './LevelSelector.module.scss';

type Props = {
  value: PreferenceWeight | null;
  onChange: (next: PreferenceWeight | null) => void;
  /** Метка для aria-label кнопки — обычно имя узла таксономии. */
  ariaLabel?: string;
};

const LEVEL_STYLE: Record<PreferenceWeight, string> = {
  1: styles.activeLevel1,
  2: styles.activeLevel2,
  3: styles.activeLevel3,
};

/**
 * Компактный селектор "степени желаемости" 1/2/3 с поддержкой отмены:
 * повторный клик по активному кружку снимает выбор (value=null).
 */
export const LevelSelector = ({ value, onChange, ariaLabel }: Props) => {
  const { t } = useTranslation();

  const handleClick = (level: PreferenceWeight) => {
    onChange(value === level ? null : level);
  };

  return (
    <div
      className={styles.root}
      role="radiogroup"
      aria-label={ariaLabel ?? t('preferences.levelGroup')}
    >
      {PREFERENCE_WEIGHTS.map((level) => {
        const isActive = value === level;
        const isDimmed = value !== null && !isActive;
        const className = [
          styles.circle,
          isActive ? styles.active : '',
          isActive ? LEVEL_STYLE[level] : '',
          isDimmed ? styles.dimmed : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <Tooltip
            key={level}
            label={t(`preferences.levelTooltip.${level}` as const)}
            withArrow
            openDelay={300}
          >
            <button
              type="button"
              className={className}
              onClick={(e) => {
                e.stopPropagation();
                handleClick(level);
              }}
              role="radio"
              aria-checked={isActive}
              aria-label={`${ariaLabel ?? ''} – ${t(`preferences.levelTooltip.${level}` as const)}`}
            >
              {level}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};
