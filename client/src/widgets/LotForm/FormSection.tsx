import type { ReactNode } from 'react';

import styles from './LotForm.module.scss';

type Props = {
  step: number;
  title: string;
  hint?: string;
  children: ReactNode;
};

/**
 * Карточка-секция формы лота с шаговой нумерацией.
 * Объединяет визуальный язык всех секций: BasicInfo, Geo, Images, Taxonomy.
 */
export const FormSection = ({ step, title, hint, children }: Props) => (
  <section className={styles.section}>
    <header className={styles.sectionHeader}>
      <span className={styles.stepBadge}>{step}</span>
      <span className={styles.stepTitle}>{title}</span>
      {hint && <span className={styles.stepHint}>{hint}</span>}
    </header>
    {children}
  </section>
);
