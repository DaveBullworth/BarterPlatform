import type { CategorySelection, Taxonomy } from './model';

// Утилиты — чистые функции над доменными данными

// Поиск пути в дереве по selection
export const resolveTaxonomyPath = (
  taxonomy: Taxonomy,
  selection: {
    chapterId: number;
    categoryId?: number | null;
    subcategoryId?: number | null;
  },
): string => {
  const chapter = taxonomy.find((c) => c.id === selection.chapterId);
  if (!chapter) return '';

  const category = selection.categoryId
    ? chapter.categories.find((c) => c.id === selection.categoryId)
    : null;

  const subcategory =
    category && selection.subcategoryId
      ? category.subcategories.find((s) => s.id === selection.subcategoryId)
      : null;

  return [chapter.name, category?.name, subcategory?.name]
    .filter(Boolean)
    .join(' → ');
};

// Хлебные крошки для LotPage
export const resolveBreadcrumbs = (
  taxonomy: Taxonomy,
  selection: {
    chapterId: number;
    categoryId?: number | null;
    subcategoryId?: number | null;
  },
): string[] => {
  const chapter = taxonomy.find((c) => c.id === selection.chapterId);
  if (!chapter) return [];

  const category = selection.categoryId
    ? chapter.categories.find((c) => c.id === selection.categoryId)
    : null;

  const subcategory =
    category && selection.subcategoryId
      ? category.subcategories.find((s) => s.id === selection.subcategoryId)
      : null;

  return [chapter.name, category?.name, subcategory?.name].filter(
    (part): part is string => Boolean(part),
  );
};

// Сравнение двух selection — используется в CategoriesDrawer
export const isSameSelection = (
  a: CategorySelection | null,
  b: CategorySelection,
): boolean => {
  if (!a) return false;
  if (a.level !== b.level) return false;

  switch (b.level) {
    case 'chapter':
      return a.level === 'chapter' && a.chapterId === b.chapterId;
    case 'category':
      return (
        a.level === 'category' &&
        a.chapterId === b.chapterId &&
        a.categoryId === b.categoryId
      );
    case 'subcategory':
      return (
        a.level === 'subcategory' &&
        a.chapterId === b.chapterId &&
        a.categoryId === b.categoryId &&
        a.subcategoryId === b.subcategoryId
      );
  }
};
