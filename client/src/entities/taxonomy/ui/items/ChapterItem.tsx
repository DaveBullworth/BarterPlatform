import { Stack, UnstyledButton, Group } from '@mantine/core';
import { ChevronRight, Building2 } from 'lucide-react';
import { type ReactNode } from 'react';

import { chapterIcons } from '@/shared/constants/chapter-icon';
import type { Chapter } from '@/entities/taxonomy';

import styles from '../Taxonomy.module.scss';

type ChapterItemProps = {
  chapter: Chapter;
  expanded: boolean;
  selected?: boolean;
  onToggle: (id: number) => void;
  rightSection?: ReactNode;
  children?: ReactNode;
};

export const ChapterItem = ({
  chapter,
  expanded,
  selected,
  onToggle,
  rightSection,
  children,
}: ChapterItemProps) => {
  const Icon = chapterIcons[chapter.slug] ?? Building2;

  const buttonClass = [
    styles.chapter,
    expanded ? styles.chapterOpen : '',
    selected ? styles.chapterSelected : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Stack gap={6}>
      <UnstyledButton
        component="div"
        onClick={() => onToggle(chapter.id)}
        className={buttonClass}
      >
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group wrap="nowrap" gap="sm">
            <span className={styles.chapterIcon}>
              <Icon size={16} strokeWidth={2} />
            </span>
            <span className={styles.chapterName}>{chapter.name}</span>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ChevronRight
              size={16}
              className={`${styles.chevron} ${
                expanded ? styles.chevronOpen : ''
              }`}
            />
            {rightSection}
          </Group>
        </Group>
      </UnstyledButton>
      {children}
    </Stack>
  );
};
