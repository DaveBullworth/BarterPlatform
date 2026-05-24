import { useState } from 'react';
import { Button, Checkbox, Modal } from '@mantine/core';
import { Layers, Pencil, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

import { TaxonomyTree } from './TaxonomyTree';
import { CategoriesSkeleton } from './CategoriesSkeleton';
import { SubcategoryItem } from './items/SubcategoryItem';
import { useTaxonomy, type Category } from '@/entities/taxonomy';

type Props = {
  value: string;
  error?: ReactNode;
  selected: {
    chapterId: number | null;
    categoryId: number | null;
    subcategoryId: number | null;
  };
  onPick: (
    chapterId: number,
    category: Category,
    subcategoryId: number | null,
  ) => void;
  /** Опциональные классы из page-родителя для summary-блока. */
  classes?: {
    summary?: string;
    summaryFilled?: string;
    summaryIcon?: string;
    summaryBody?: string;
    summaryPlaceholder?: string;
    summaryPath?: string;
    summaryError?: string;
    summaryAction?: string;
  };
};

const getCategoryKey = (chapterId: number, categoryId: number) =>
  `${chapterId}:${categoryId}`;

export const TaxonomySection = ({
  value,
  error,
  selected,
  onPick,
  classes = {},
}: Props) => {
  const { t } = useTranslation();
  const { data: taxonomy = [], isLoading } = useTaxonomy();
  const [opened, setOpened] = useState(false);

  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    new Set(),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [showContent, setShowContent] = useState(false);

  const handleOpen = () => {
    const chapters = new Set<number>();
    const categories = new Set<string>();

    if (selected.chapterId) {
      chapters.add(selected.chapterId);
      if (selected.categoryId) {
        categories.add(getCategoryKey(selected.chapterId, selected.categoryId));
      }
    }

    setExpandedChapters(chapters);
    setExpandedCategories(categories);
    setOpened(true);
  };

  const toggleChapter = (id: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCategory = (chapterId: number, categoryId: number) => {
    const key = getCategoryKey(chapterId, categoryId);
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isFilled = Boolean(value);
  const summaryClass = [
    classes.summary,
    isFilled ? classes.summaryFilled : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className={summaryClass}>
        <span className={classes.summaryIcon}>
          <Layers size={16} strokeWidth={2} />
        </span>
        <div className={classes.summaryBody}>
          {isFilled ? (
            <span className={classes.summaryPath}>{value}</span>
          ) : (
            <span className={classes.summaryPlaceholder}>
              {t('lotForm.taxonomy.placeholder')}
            </span>
          )}
          {error && <span className={classes.summaryError}>{error}</span>}
        </div>
        <Button
          variant={isFilled ? 'default' : 'filled'}
          size="xs"
          className={classes.summaryAction}
          leftSection={
            isFilled ? <Pencil size={14} /> : <Plus size={14} />
          }
          onClick={handleOpen}
        >
          {t('lotForm.taxonomy.selectButton')}
        </Button>
      </div>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('lotForm.modal.selectCategory')}
        size="lg"
        onEnterTransitionEnd={() => setShowContent(true)}
        onExitTransitionEnd={() => setShowContent(false)}
      >
        {isLoading || !showContent ? (
          <CategoriesSkeleton />
        ) : (
          <TaxonomyTree
            taxonomy={taxonomy}
            expandedChapters={expandedChapters}
            expandedCategories={expandedCategories}
            onToggleChapter={toggleChapter}
            onToggleCategory={toggleCategory}
            isCategorySelected={(chapterId, category) =>
              selected.chapterId === chapterId &&
              selected.categoryId === category.id &&
              !selected.subcategoryId
            }
            renderCategoryRight={({
              chapterId,
              category,
              hasSubcategories,
            }) => {
              if (hasSubcategories) return null;
              return (
                <Checkbox
                  color="barter"
                  checked={
                    selected.chapterId === chapterId &&
                    selected.categoryId === category.id &&
                    !selected.subcategoryId
                  }
                  onChange={() => {
                    onPick(chapterId, category, null);
                    setOpened(false);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              );
            }}
            renderSubcategory={({ chapterId, category, subcategory }) => (
              <SubcategoryItem
                subcategory={subcategory}
                selected={selected.subcategoryId === subcategory.id}
                onSelect={() => {
                  onPick(chapterId, category, subcategory.id);
                  setOpened(false);
                }}
              />
            )}
          />
        )}
      </Modal>
    </>
  );
};
