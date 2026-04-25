import {
  Stack,
  Collapse,
  UnstyledButton,
  Group,
  Text,
  ThemeIcon,
  Box,
} from '@mantine/core';
import { ChevronRight, Building2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { chapterIcons } from '@/shared/constants/chapter-icon';
import type {
  Taxonomy,
  Category,
  Chapter,
  Subcategory,
} from '@/entities/taxonomy';

// Приватные подкомпоненты — не экспортируем
// Живут здесь потому что нужны только TaxonomyTree

type ChapterItemProps = {
  chapter: Chapter;
  expanded: boolean;
  selected?: boolean;
  onToggle: (id: number) => void;
  rightSection?: ReactNode;
  children?: ReactNode;
};

const ChapterItem = ({
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

type CategoryItemProps = {
  category: Category;
  expanded: boolean;
  selected?: boolean;
  hasSubcategories: boolean;
  onToggle?: () => void;
  rightSection?: ReactNode;
  children?: ReactNode;
};

const CategoryItem = ({
  category,
  expanded,
  selected,
  hasSubcategories,
  onToggle,
  rightSection,
  children,
}: CategoryItemProps) => {
  return (
    <Stack gap={4}>
      <UnstyledButton
        onClick={hasSubcategories ? onToggle : undefined}
        style={{
          borderRadius: 8,
          border: '1px solid var(--mantine-color-gray-2)',
          padding: '6px 10px',
          backgroundColor: selected
            ? 'var(--mantine-color-blue-0)'
            : 'var(--mantine-color-white)',
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm">{category.name}</Text>
          <Group gap="xs" wrap="nowrap">
            {hasSubcategories ? (
              <ChevronRight
                size={14}
                style={{
                  transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 150ms ease',
                }}
              />
            ) : (
              <Box w={14} />
            )}
            {rightSection}
          </Group>
        </Group>
      </UnstyledButton>
      {hasSubcategories && expanded && children}
    </Stack>
  );
};

// Публичные типы для кастомизации дерева

type RenderChapterRightFn = (chapterId: number) => ReactNode;

type RenderCategoryRightFn = (params: {
  chapterId: number;
  category: Category;
  hasSubcategories: boolean;
}) => ReactNode;

type RenderSubcategoryFn = (params: {
  chapterId: number;
  category: Category;
  subcategory: Subcategory;
}) => ReactNode;

export type TaxonomyTreeProps = {
  taxonomy: Taxonomy;
  expandedChapters: Set<number>;
  expandedCategories: Set<string>;
  onToggleChapter: (chapterId: number) => void;
  onToggleCategory: (chapterId: number, categoryId: number) => void;
  renderChapterRight?: RenderChapterRightFn;
  renderCategoryRight?: RenderCategoryRightFn;
  renderSubcategory?: RenderSubcategoryFn;
  isCategorySelected?: (chapterId: number, category: Category) => boolean;
};

const getCategoryKey = (chapterId: number, categoryId: number) =>
  `${chapterId}:${categoryId}`;

export const TaxonomyTree = ({
  taxonomy,
  expandedChapters,
  expandedCategories,
  onToggleChapter,
  onToggleCategory,
  renderChapterRight,
  renderCategoryRight,
  renderSubcategory,
  isCategorySelected,
}: TaxonomyTreeProps) => {
  return (
    <Stack gap="sm">
      {taxonomy.map((chapter) => {
        const chapterExpanded = expandedChapters.has(chapter.id);

        return (
          <ChapterItem
            key={chapter.id}
            chapter={chapter}
            expanded={chapterExpanded}
            onToggle={onToggleChapter}
            rightSection={renderChapterRight?.(chapter.id)}
          >
            <Collapse in={chapterExpanded}>
              <Stack pl="md" gap={4}>
                {chapter.categories.map((category) => {
                  const hasSubcategories = category.subcategories.length > 0;
                  const categoryKey = getCategoryKey(chapter.id, category.id);
                  const categoryExpanded = expandedCategories.has(categoryKey);
                  const categorySelected =
                    isCategorySelected?.(chapter.id, category) ?? false;

                  return (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      expanded={categoryExpanded}
                      selected={categorySelected}
                      hasSubcategories={hasSubcategories}
                      onToggle={() => onToggleCategory(chapter.id, category.id)}
                      rightSection={renderCategoryRight?.({
                        chapterId: chapter.id,
                        category,
                        hasSubcategories,
                      })}
                    >
                      <Collapse in={categoryExpanded}>
                        <Stack pl="md" gap={4}>
                          {category.subcategories.map(
                            (subcategory) =>
                              renderSubcategory?.({
                                chapterId: chapter.id,
                                category,
                                subcategory,
                              }) ?? (
                                <Text key={subcategory.id} size="sm" pl="xs">
                                  {subcategory.name}
                                </Text>
                              ),
                          )}
                        </Stack>
                      </Collapse>
                    </CategoryItem>
                  );
                })}
              </Stack>
            </Collapse>
          </ChapterItem>
        );
      })}
    </Stack>
  );
};
