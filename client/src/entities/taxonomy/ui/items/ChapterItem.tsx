import { Stack, UnstyledButton, Group, Text, ThemeIcon } from '@mantine/core';
import { ChevronRight, Building2 } from 'lucide-react';
import { type ReactNode } from 'react';
import { chapterIcons } from '@/shared/constants/chapter-icon';
import type { Chapter } from '@/entities/taxonomy';

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

  return (
    <Stack gap={expanded ? 'sm' : 0}>
      <UnstyledButton
        onClick={() => onToggle(chapter.id)}
        style={{
          borderRadius: 10,
          border: '1px solid var(--mantine-color-gray-3)',
          padding: '8px 10px',
          backgroundColor: selected
            ? 'var(--mantine-color-blue-0)'
            : 'var(--mantine-color-white)',
        }}
      >
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group wrap="nowrap" gap="xs">
            <ThemeIcon variant="light" size="sm">
              <Icon size={15} />
            </ThemeIcon>
            <Text size="sm" fw={600}>
              {chapter.name}
            </Text>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ChevronRight
              size={16}
              style={{
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 150ms ease',
              }}
            />
            {rightSection}
          </Group>
        </Group>
      </UnstyledButton>
      {expanded && children}
    </Stack>
  );
};
