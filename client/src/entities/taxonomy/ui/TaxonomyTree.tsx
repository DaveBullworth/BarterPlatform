import {
  Fragment,
  memo,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Stack, Collapse, Text, Loader } from '@mantine/core';

import { ChapterItem } from './items/ChapterItem';
import { CategoryItem } from './items/CategoryItem';
import type { Taxonomy, Category, Subcategory } from '@/entities/taxonomy';

import styles from './Taxonomy.module.scss';

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

// Должно совпадать с CSS-transition'ами в Taxonomy.module.scss
const COLLAPSE_DURATION = 220;

/**
 * Локальный fallback на время первого раскрытия: тяжёлая ветка категорий
 * может монтироваться заметно — рисуем приглушённый спиннер,
 * чтобы клик чувствовался мгновенно.
 */
const BranchLoader = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 10px',
      color: 'var(--mantine-color-dimmed)',
      fontSize: 12,
    }}
  >
    <Loader size={12} color="barter" />
    <span>…</span>
  </div>
);

/**
 * Внутренний компонент для рендера ветви категорий главы.
 * Вынесен с `memo`, чтобы перерендер одной главы не цеплял остальные.
 */
const ChapterBranch = memo(function ChapterBranch({
  chapter,
  expanded,
  expandedCategories,
  onToggleCategory,
  renderCategoryRight,
  renderSubcategory,
  isCategorySelected,
}: {
  chapter: Taxonomy[number];
  expanded: boolean;
  expandedCategories: Set<string>;
  onToggleCategory: (chapterId: number, categoryId: number) => void;
  renderCategoryRight?: RenderCategoryRightFn;
  renderSubcategory?: RenderSubcategoryFn;
  isCategorySelected?: (chapterId: number, category: Category) => boolean;
}) {
  // "Ever expanded" — после первого открытия дерево уже не размонтируется,
  // дальнейшие сворачивания идут через CSS-анимацию Collapse без mount-mount.
  const [wasOpen, setWasOpen] = useState(expanded);
  if (expanded && !wasOpen) setWasOpen(true);

  if (!wasOpen) return null;

  return (
    <Collapse
      in={expanded}
      transitionDuration={COLLAPSE_DURATION}
      transitionTimingFunction="cubic-bezier(0.16, 1, 0.3, 1)"
    >
      <div className={styles.nested}>
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
              <CategoryBranch
                chapter={chapter}
                category={category}
                expanded={categoryExpanded}
                renderSubcategory={renderSubcategory}
              />
            </CategoryItem>
          );
        })}
      </div>
    </Collapse>
  );
});

const CategoryBranch = memo(function CategoryBranch({
  chapter,
  category,
  expanded,
  renderSubcategory,
}: {
  chapter: Taxonomy[number];
  category: Category;
  expanded: boolean;
  renderSubcategory?: RenderSubcategoryFn;
}) {
  const [wasOpen, setWasOpen] = useState(expanded);
  if (expanded && !wasOpen) setWasOpen(true);

  if (!wasOpen) return null;

  return (
    <Collapse
      in={expanded}
      transitionDuration={COLLAPSE_DURATION}
      transitionTimingFunction="cubic-bezier(0.16, 1, 0.3, 1)"
    >
      <div className={styles.nestedTight}>
        {category.subcategories.map((subcategory) => (
          <Fragment key={subcategory.id}>
            {renderSubcategory?.({
              chapterId: chapter.id,
              category,
              subcategory,
            }) ?? (
              <Text size="sm" pl="xs">
                {subcategory.name}
              </Text>
            )}
          </Fragment>
        ))}
      </div>
    </Collapse>
  );
});

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
  // Передаём готовые memo'и в стабильных пропсах, чтобы memo-обёртки реально работали
  const chaptersList = useMemo(() => taxonomy, [taxonomy]);

  return (
    <Stack gap="xs">
      {chaptersList.map((chapter) => {
        const chapterExpanded = expandedChapters.has(chapter.id);

        return (
          <ChapterItem
            key={chapter.id}
            chapter={chapter}
            expanded={chapterExpanded}
            onToggle={onToggleChapter}
            rightSection={renderChapterRight?.(chapter.id)}
          >
            <ChapterBranch
              chapter={chapter}
              expanded={chapterExpanded}
              expandedCategories={expandedCategories}
              onToggleCategory={onToggleCategory}
              renderCategoryRight={renderCategoryRight}
              renderSubcategory={renderSubcategory}
              isCategorySelected={isCategorySelected}
            />
          </ChapterItem>
        );
      })}
    </Stack>
  );
};

// Экспорт fallback'а для случаев, когда категории грузятся отдельно от дерева
export const TaxonomyBranchLoader = BranchLoader;
