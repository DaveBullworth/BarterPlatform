import { memo } from 'react';
import {
  Stack,
  UnstyledButton,
  Group,
  ThemeIcon,
  Text,
  Checkbox,
} from '@mantine/core';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  chapter: {
    id: number;
    name: string;
    slug: string;
  };
  ChapterIcon: LucideIcon;

  expanded: boolean;
  selected: boolean;

  onToggle: (chapterId: number) => void;
  onSelect: () => void;

  children?: React.ReactNode;
};

export const ChapterItem = memo(
  ({
    chapter,
    ChapterIcon,
    expanded,
    selected,
    onToggle,
    onSelect,
    children,
  }: Props) => {
    return (
      <Stack gap={expanded ? 'sm' : 0} px="sm">
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
                <ChapterIcon size={15} />
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

              <Checkbox
                checked={selected}
                onChange={onSelect}
                onClick={(e) => e.stopPropagation()}
                aria-label={chapter.name}
              />
            </Group>
          </Group>
        </UnstyledButton>

        {/* КЛЮЧЕВАЯ ОПТИМИЗАЦИЯ */}
        {expanded && children}
      </Stack>
    );
  },
);
