import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import styles from './RouteProgressBar.module.scss';

/**
 * Тонкий top-bar, который вспыхивает на ~650мс при каждой смене pathname.
 * Даёт мгновенный визуальный фидбек, что навигация началась, пока lazy-chunk
 * и query грузятся. Анимация полностью CSS-managed (animation:
 * routeProgress ... forwards) — компонент только подменяет key,
 * чтобы анимация перезапустилась на новом pathname.
 */
export const RouteProgressBar = () => {
  const { pathname } = useLocation();
  const [prevPath, setPrevPath] = useState(pathname);
  const [tick, setTick] = useState(0);

  // Derived state из props (React-pattern): меняется pathname →
  // mid-render обновляем tick, чтобы переключить key и перезапустить CSS-анимацию.
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setTick((t) => t + 1);
  }

  // На первом монтировании не рисуем индикатор — он зажигается только
  // при последующих сменах роута.
  if (tick === 0) return null;

  return (
    <div className={styles.bar} aria-hidden>
      <div key={tick} className={styles.indicator} />
    </div>
  );
};
