import { useState } from 'react';
import { Checkbox, Modal } from '@mantine/core';
import { SkeletonList } from '@/app/layout/categoriesDrawer/ChapterItemSkeleton';
import { TaxonomyTree, type TaxonomyTreeProps } from '@/shared/ui/TaxonomyTree';
import { SubcategoryItem } from '@/app/layout/categoriesDrawer/SubcategoryItem';
import type { TaxonomyCategory } from '@/types/taxonomy';

type Props = Pick<
  TaxonomyTreeProps,
  | 'taxonomy'
  | 'expandedChapters'
  | 'expandedCategories'
  | 'onToggleChapter'
  | 'onToggleCategory'
> & {
  opened: boolean;
  onClose: () => void;

  title: string;

  values: {
    chapterId: number | null;
    categoryId: number | null;
    subcategoryId: number | null;
  };

  onPick: (
    chapterId: number,
    category: TaxonomyCategory,
    subcategoryId: number | null,
  ) => void;
};

export const TaxonomyPickerModal = ({
  opened,
  onClose,
  title,
  taxonomy,
  expandedChapters,
  expandedCategories,
  onToggleChapter,
  onToggleCategory,
  values,
  onPick,
}: Props) => {
  const [showContent, setShowContent] = useState(false);

  return (
    <Modal
      opened={opened}
      onClose={() => {
        setShowContent(false);
        onClose();
      }}
      onEnterTransitionEnd={() => setShowContent(true)}
      onExitTransitionEnd={() => setShowContent(false)}
      title={title}
      size="lg"
    >
      {!showContent ? (
        <SkeletonList />
      ) : (
        <TaxonomyTree
          taxonomy={taxonomy}
          expandedChapters={expandedChapters}
          expandedCategories={expandedCategories}
          onToggleChapter={onToggleChapter}
          onToggleCategory={onToggleCategory}
          isCategorySelected={(chapterId, category) =>
            values.chapterId === chapterId &&
            values.categoryId === category.id &&
            !values.subcategoryId
          }
          renderCategoryRight={({ chapterId, category, hasSubcategories }) => {
            if (hasSubcategories) return null;

            return (
              <Checkbox
                checked={
                  values.chapterId === chapterId &&
                  values.categoryId === category.id &&
                  !values.subcategoryId
                }
                onChange={() => {
                  onPick(chapterId, category, null);
                  setShowContent(false);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            );
          }}
          renderSubcategory={({ chapterId, category, subcategory }) => (
            <SubcategoryItem
              subcategory={subcategory}
              selected={values.subcategoryId === subcategory.id}
              onSelect={() => {
                onPick(chapterId, category, subcategory.id);
                setShowContent(false);
              }}
            />
          )}
        />
      )}
    </Modal>
  );
};
