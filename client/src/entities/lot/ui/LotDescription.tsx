import { UnstyledButton } from '@mantine/core';
import { ChevronDown } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from '../Lot.module.scss';

const COLLAPSED_HEIGHT = 240;

type Props = {
  description: string;
  /** Опциональные классы из страницы-родителя для оформления секции. */
  classes?: {
    section?: string;
    sectionTitle?: string;
    sectionTitleAccent?: string;
    text?: string;
  };
};

export const LotDescription = ({ description, classes = {} }: Props) => {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [naturalHeight, setNaturalHeight] = useState(0);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setNaturalHeight(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [description]);

  const overflows = naturalHeight > COLLAPSED_HEIGHT;
  const maxHeight = !overflows
    ? undefined
    : expanded
      ? naturalHeight
      : COLLAPSED_HEIGHT;

  const wrapperClass = [
    styles.descriptionWrapper,
    overflows && !expanded ? styles.descriptionWrapperFaded : '',
  ]
    .filter(Boolean)
    .join(' ');

  const chevronClass = [
    styles.descriptionChevron,
    expanded ? styles.descriptionChevronOpen : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes.section}>
      <div className={classes.sectionTitle}>
        <span className={classes.sectionTitleAccent} />
        <span>{t('lot.description')}</span>
      </div>

      <div
        className={wrapperClass}
        style={maxHeight !== undefined ? { maxHeight } : undefined}
      >
        <div ref={contentRef}>
          <p
            className={classes.text}
            style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
          >
            {description}
          </p>
        </div>
      </div>

      {overflows && (
        <UnstyledButton
          className={styles.descriptionToggle}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span>{expanded ? t('lot.collapse') : t('lot.expand')}</span>
          <ChevronDown size={16} className={chevronClass} />
        </UnstyledButton>
      )}
    </div>
  );
};
