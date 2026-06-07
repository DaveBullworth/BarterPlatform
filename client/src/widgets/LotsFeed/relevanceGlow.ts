import styles from './LotsFeed.module.scss';

/**
 * Маппит уровень релевантности лота (0–5 с бэка) в классы неоновой подсветки
 * карточки. 0 / undefined → без подсветки.
 */
export const relevanceGlowClass = (level?: number | null): string => {
  if (!level || level < 1) return '';
  const clamped = Math.min(Math.max(Math.round(level), 1), 5);
  return `${styles.glow} ${styles[`glow${clamped}`]}`;
};
