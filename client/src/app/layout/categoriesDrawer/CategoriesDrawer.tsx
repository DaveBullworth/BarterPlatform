import { Button, Checkbox, Drawer, Group, Text } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  clearCategorySelection,
  selectCategorySelection,
  setCategorySelection,
} from '@/store/categoryFilterSlice';
import {
  fetchTaxonomyIfNeeded,
  selectTaxonomy,
  selectTaxonomyStatus,
} from '@/store/taxonomySlice';
import { SubcategoryItem } from './SubcategoryItem';
import type { AppDispatch } from '@/store';
import type { CategorySelection } from '@/types/taxonomy';

import { SkeletonList } from './ChapterItemSkeleton';
import { TaxonomyTree } from '@/shared/ui/TaxonomyTree';
import styles from '../MainLayout.module.scss';

type Props = {
  opened: boolean;
  onClose: () => void;
};

const getCategoryKey = (chapterId: number, categoryId: number) =>
  `${chapterId}:${categoryId}`;

const isSameSelection = (
  current: CategorySelection | null,
  next: CategorySelection,
) => {
  switch (next.level) {
    case 'chapter':
      return (
        current?.level === 'chapter' && current.chapterId === next.chapterId
      );
    case 'category':
      return (
        current?.level === 'category' &&
        current.chapterId === next.chapterId &&
        current.categoryId === next.categoryId
      );
    case 'subcategory':
      return (
        current?.level === 'subcategory' &&
        current.chapterId === next.chapterId &&
        current.categoryId === next.categoryId &&
        current.subcategoryId === next.subcategoryId
      );
  }
};

export const CategoriesDrawer = ({ opened, onClose }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const selected = useSelector(selectCategorySelection);
  const data = useSelector(selectTaxonomy);
  const taxonomyStatus = useSelector(selectTaxonomyStatus);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    new Set(),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [showContent, setShowContent] = useState(false);

  const isChapterSelected = (chapterId: number) => {
    return selected?.level === 'chapter' && selected.chapterId === chapterId;
  };

  const isCategorySelected = (chapterId: number, categoryId: number) => {
    return (
      selected?.level === 'category' &&
      selected.chapterId === chapterId &&
      selected.categoryId === categoryId
    );
  };

  const isSubcategorySelected = (
    chapterId: number,
    categoryId: number,
    subcategoryId: number,
  ) => {
    return (
      selected?.level === 'subcategory' &&
      selected.chapterId === chapterId &&
      selected.categoryId === categoryId &&
      selected.subcategoryId === subcategoryId
    );
  };

  const initExpandedFromSelection = useCallback(() => {
    if (!selected) {
      setExpandedChapters(new Set());
      setExpandedCategories(new Set());
      return;
    }

    const chapters = new Set<number>();
    const categories = new Set<string>();

    switch (selected.level) {
      case 'chapter':
        // ничего не раскрываем
        break;

      case 'category':
        chapters.add(selected.chapterId);
        break;

      case 'subcategory':
        chapters.add(selected.chapterId);
        categories.add(getCategoryKey(selected.chapterId, selected.categoryId));
        break;
    }

    setExpandedChapters(chapters);
    setExpandedCategories(categories);
  }, [selected]);

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const toggleCategory = (chapterId: number, categoryId: number) => {
    const key = getCategoryKey(chapterId, categoryId);

    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelection = (next: CategorySelection) => {
    if (isSameSelection(selected, next)) {
      dispatch(clearCategorySelection());
      return;
    }

    dispatch(setCategorySelection(next));
  };

  const handleClose = () => {
    setExpandedChapters(new Set());
    setExpandedCategories(new Set());
    onClose();
  };

  useEffect(() => {
    if (!opened) return;
    dispatch(fetchTaxonomyIfNeeded());
  }, [dispatch, opened]);

  useEffect(() => {
    if (opened) {
      // асинхронно вызываем функцию
      const timeout = setTimeout(() => {
        initExpandedFromSelection();
      }, 0);

      return () => clearTimeout(timeout); // очистка на unmount / закрытие
    }
  }, [opened, initExpandedFromSelection]);

  return (
    <Drawer
      opened={opened}
      onEnterTransitionEnd={() => setShowContent(true)}
      onExitTransitionEnd={() => setShowContent(false)}
      onClose={handleClose}
      position="left"
      size="lg"
      title={t('categories.title')}
      className={styles.notificationsDrawer}
    >
      <Group mb="sm" justify="space-between" px="sm">
        <Text size="sm" c="dimmed">
          {t('categories.hint')}
        </Text>
        <Button
          variant="subtle"
          size="compact-sm"
          onClick={() => dispatch(clearCategorySelection())}
        >
          {t('categories.reset')}
        </Button>
      </Group>

      {!showContent || taxonomyStatus === 'loading' ? (
        <SkeletonList />
      ) : (
        <TaxonomyTree
          taxonomy={data}
          expandedChapters={expandedChapters}
          expandedCategories={expandedCategories}
          onToggleChapter={toggleChapter}
          onToggleCategory={toggleCategory}
          renderChapterRight={(chapterId) => (
            <Checkbox
              checked={isChapterSelected(chapterId)}
              onChange={() =>
                toggleSelection({
                  level: 'chapter',
                  chapterId,
                })
              }
              onClick={(e) => e.stopPropagation()}
            />
          )}
          renderCategoryRight={({ chapterId, category }) => (
            <Checkbox
              checked={isCategorySelected(chapterId, category.id)}
              onChange={() =>
                toggleSelection({
                  level: 'category',
                  chapterId,
                  categoryId: category.id,
                })
              }
              onClick={(e) => e.stopPropagation()}
            />
          )}
          renderSubcategory={({ chapterId, category, subcategory }) => (
            <SubcategoryItem
              subcategory={subcategory}
              selected={isSubcategorySelected(
                chapterId,
                category.id,
                subcategory.id,
              )}
              onSelect={() =>
                toggleSelection({
                  level: 'subcategory',
                  chapterId,
                  categoryId: category.id,
                  subcategoryId: subcategory.id,
                })
              }
            />
          )}
        />
      )}
    </Drawer>
  );
};
