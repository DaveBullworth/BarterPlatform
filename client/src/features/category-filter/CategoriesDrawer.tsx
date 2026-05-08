import { useEffect, useState } from 'react';
import { Button, Checkbox, Drawer, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import {
  TaxonomyTree,
  useTaxonomy,
  SubcategoryItem,
  CategoriesSkeleton,
  type CategorySelection,
} from '@/entities/taxonomy';
import { useCategorySelection } from './useCategorySelection';
import { CATEGORY_PARAM } from '@/shared/constants/category-filter-param';

import styles from '../../widgets/AppHeader/AppHeader.module.scss';

type Props = {
  opened: boolean;
  onClose: () => void;
};

const getCategoryKey = (chapterId: number, categoryId: number) =>
  `${chapterId}:${categoryId}`;

// Из selection вычисляем какие узлы должны быть раскрыты
const computeExpansionFromSelection = (
  selection: CategorySelection | null,
): { chapters: Set<number>; categories: Set<string> } => {
  const chapters = new Set<number>();
  const categories = new Set<string>();

  if (!selection) return { chapters, categories };

  // Всегда раскрываем chapter если есть любой выбор ниже него
  if (
    selection.level === CATEGORY_PARAM.CATEGORY ||
    selection.level === CATEGORY_PARAM.SUBCATEGORY
  ) {
    chapters.add(selection.chapterId);
  }

  // ТОЛЬКО для subcategory раскрываем category
  if (selection.level === CATEGORY_PARAM.SUBCATEGORY) {
    categories.add(getCategoryKey(selection.chapterId, selection.categoryId));
  }

  return { chapters, categories };
};

export const CategoriesDrawer = ({ opened, onClose }: Props) => {
  const { t } = useTranslation();
  const { data: taxonomy = [], isLoading } = useTaxonomy();
  const { selection, toggleSelection, clear } = useCategorySelection();

  // Состояние раскрытия — пользователь может раскрывать/сворачивать
  // вне зависимости от выбора. Инициализируется из selection при открытии.
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    new Set(),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [showContent, setShowContent] = useState(false);

  // При открытии drawer — синхронизируем раскрытие с selection
  useEffect(() => {
    if (!opened) return;
    const { chapters, categories } = computeExpansionFromSelection(selection);
    setExpandedChapters(chapters);
    setExpandedCategories(categories);
    // selection берётся в начале открытия — изменения внутри drawer
    // не должны автоматически менять раскрытие
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

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

  // Helpers для проверки выделения
  const isChapterSelected = (chapterId: number) =>
    selection?.level === CATEGORY_PARAM.CHAPTER &&
    selection.chapterId === chapterId;

  const isCategorySelected = (chapterId: number, categoryId: number) =>
    selection?.level === CATEGORY_PARAM.CATEGORY &&
    selection.chapterId === chapterId &&
    selection.categoryId === categoryId;

  const isSubcategorySelected = (
    chapterId: number,
    categoryId: number,
    subcategoryId: number,
  ) =>
    selection?.level === CATEGORY_PARAM.SUBCATEGORY &&
    selection.chapterId === chapterId &&
    selection.categoryId === categoryId &&
    selection.subcategoryId === subcategoryId;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="left"
      size="lg"
      title={t('categories.title')}
      onEnterTransitionEnd={() => setShowContent(true)}
      onExitTransitionEnd={() => setShowContent(false)}
      className={styles.drawer_}
    >
      <Group mb="sm" justify="space-between">
        <Text size="sm" c="dimmed">
          {t('categories.hint')}
        </Text>
        <Button variant="subtle" size="compact-sm" onClick={clear}>
          {t('categories.reset')}
        </Button>
      </Group>

      {isLoading || !showContent ? (
        <CategoriesSkeleton />
      ) : (
        <TaxonomyTree
          taxonomy={taxonomy}
          expandedChapters={expandedChapters}
          expandedCategories={expandedCategories}
          onToggleChapter={toggleChapter}
          onToggleCategory={toggleCategory}
          renderChapterRight={(chapterId) => (
            <Checkbox
              checked={isChapterSelected(chapterId)}
              onChange={() =>
                toggleSelection({ level: CATEGORY_PARAM.CHAPTER, chapterId })
              }
              onClick={(e) => e.stopPropagation()}
            />
          )}
          renderCategoryRight={({ chapterId, category }) => (
            <Checkbox
              checked={isCategorySelected(chapterId, category.id)}
              onChange={() =>
                toggleSelection({
                  level: CATEGORY_PARAM.CATEGORY,
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
                  level: CATEGORY_PARAM.SUBCATEGORY,
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
