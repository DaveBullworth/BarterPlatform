import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

import styles from './EmptyState.module.scss';

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
};

/**
 * Универсальный empty-state с фирменным "кругом" и иконкой.
 * Используется в местах "ничего не найдено / список пуст".
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
}: Props) => {
  const wrapperClass = compact
    ? `${styles.wrapper} ${styles.compact}`
    : styles.wrapper;

  return (
    <div className={wrapperClass}>
      <span className={styles.iconBubble}>
        <Icon size={compact ? 26 : 36} strokeWidth={1.75} />
      </span>
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {action}
    </div>
  );
};
