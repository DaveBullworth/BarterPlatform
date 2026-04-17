import { Stack, Collapse } from '@mantine/core';
import { Building2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { ChapterItem } from '@/app/layout/categoriesDrawer/ChapterItem';
import { CategoryItem } from '@/app/layout/categoriesDrawer/CategoryItem';
import { SubcategoryItem } from '@/app/layout/categoriesDrawer/SubcategoryItem';
import { chapterIcons } from '@/shared/utils/chapterIcons';
import type {
  TaxonomyCategory,
  TaxonomyChapter,
  TaxonomySubcategory,
} from '@/types/taxonomy';

// ---- Types ----
type Chapter = TaxonomyChapter;
type Category = TaxonomyCategory;
type Subcategory = TaxonomySubcategory;

type RenderCategoryRightParams = {
  chapterId: number;
  category: Category;
  hasSubcategories: boolean;
};

type RenderSubcategoryParams = {
  chapterId: number;
  category: Category;
  subcategory: Subcategory;
};

export type TaxonomyTreeProps = {
  taxonomy: Chapter[];

  expandedChapters: Set<number>;
  expandedCategories: Set<string>;

  onToggleChapter: (chapterId: number) => void;
  onToggleCategory: (chapterId: number, categoryId: number) => void;

  // optional кастомизация
  renderChapterRight?: (chapterId: number) => ReactNode;
  renderCategoryRight?: (params: RenderCategoryRightParams) => ReactNode;

  renderSubcategory?: (params: RenderSubcategoryParams) => ReactNode;

  // опционально: выделение
  isCategorySelected?: (chapterId: number, category: Category) => boolean;
};

const getCategoryKey = (chapterId: number, categoryId: number) =>
  `${chapterId}:${categoryId}`;

// ---- Component ----
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
        const ChapterIcon = chapterIcons[chapter.slug] ?? Building2;
        const chapterExpanded = expandedChapters.has(chapter.id);

        return (
          <ChapterItem
            key={chapter.id}
            chapter={chapter}
            ChapterIcon={ChapterIcon}
            expanded={chapterExpanded}
            onToggle={onToggleChapter}
            rightSection={renderChapterRight?.(chapter.id) ?? null}
          >
            <Collapse in={chapterExpanded}>
              {chapterExpanded && (
                <Stack pl="md" gap={4}>
                  {chapter.categories.map((category) => {
                    const hasSubcategories = category.subcategories.length > 0;

                    const categoryKey = getCategoryKey(chapter.id, category.id);

                    const categoryExpanded =
                      expandedCategories.has(categoryKey);

                    const categorySelected =
                      isCategorySelected?.(chapter.id, category) ?? false;

                    return (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        expanded={categoryExpanded}
                        selected={categorySelected}
                        hasSubcategories={hasSubcategories}
                        onToggle={() =>
                          onToggleCategory(chapter.id, category.id)
                        }
                        rightSection={
                          renderCategoryRight?.({
                            chapterId: chapter.id,
                            category,
                            hasSubcategories,
                          }) ?? null
                        }
                      >
                        {hasSubcategories && categoryExpanded && (
                          <Collapse in={categoryExpanded}>
                            <Stack pl="md" gap={4}>
                              {category.subcategories.map((subcategory) => {
                                // если передали кастомный рендер — используем его
                                if (renderSubcategory) {
                                  return (
                                    <div key={subcategory.id}>
                                      {renderSubcategory({
                                        chapterId: chapter.id,
                                        category,
                                        subcategory,
                                      })}
                                    </div>
                                  );
                                }

                                // fallback (если не передали)
                                return (
                                  <SubcategoryItem
                                    key={subcategory.id}
                                    subcategory={subcategory}
                                    selected={false}
                                    onSelect={() => {}}
                                  />
                                );
                              })}
                            </Stack>
                          </Collapse>
                        )}
                      </CategoryItem>
                    );
                  })}
                </Stack>
              )}
            </Collapse>
          </ChapterItem>
        );
      })}
    </Stack>
  );
};
