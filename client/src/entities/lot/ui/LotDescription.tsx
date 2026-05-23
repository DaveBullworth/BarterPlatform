import { Badge, Card, Text, UnstyledButton } from '@mantine/core';
import { ChevronDown } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from '../Lot.module.scss';

const COLLAPSED_HEIGHT = 200;

type Props = {
  description: string;
};

export const LotDescription = ({ description }: Props) => {
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
    <Card withBorder>
      <Badge mb={8} variant="light" color="accent">
        {t('lot.description')}
      </Badge>
      <div
        className={wrapperClass}
        style={maxHeight !== undefined ? { maxHeight } : undefined}
      >
        <div ref={contentRef}>
          <Text style={{ overflowWrap: 'anywhere' }}>{description}</Text>
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
    </Card>
  );
};
