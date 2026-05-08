import { Fragment, type ReactNode } from 'react';
import { Stack, Collapse, Text } from '@mantine/core';

import { ChapterItem } from './items/ChapterItem';
import { CategoryItem } from './items/CategoryItem';
import type { Taxonomy, Category, Subcategory } from '@/entities/taxonomy';

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
