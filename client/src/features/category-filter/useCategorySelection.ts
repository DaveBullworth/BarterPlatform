import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { isSameSelection, type CategorySelection } from '@/entities/taxonomy';
import { CATEGORY_PARAM } from '@/shared/constants/category-filter-param';
import { ROUTES } from '@/shared/constants/routes';

const parseId = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

// Парсинг selection из URL params
const parseSelection = (params: URLSearchParams): CategorySelection | null => {
  const chapterId = parseId(params.get(CATEGORY_PARAM.CHAPTER));
  if (!chapterId) return null;

  const categoryId = parseId(params.get(CATEGORY_PARAM.CATEGORY));
  if (!categoryId) return { level: CATEGORY_PARAM.CHAPTER, chapterId };

  const subcategoryId = parseId(params.get(CATEGORY_PARAM.SUBCATEGORY));
  if (!subcategoryId)
    return { level: CATEGORY_PARAM.CATEGORY, chapterId, categoryId };

  return {
    level: CATEGORY_PARAM.SUBCATEGORY,
    chapterId,
    categoryId,
    subcategoryId,
  };
};

export const useCategorySelection = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const selection = useMemo(() => parseSelection(searchParams), [searchParams]);

  const setSelection = useCallback(
    (next: CategorySelection | null) => {
      const updated = new URLSearchParams(searchParams);
      updated.delete(CATEGORY_PARAM.CHAPTER);
      updated.delete(CATEGORY_PARAM.CATEGORY);
      updated.delete(CATEGORY_PARAM.SUBCATEGORY);

      if (next) {
        updated.set(CATEGORY_PARAM.CHAPTER, String(next.chapterId));
        if (next.level !== CATEGORY_PARAM.CHAPTER) {
          updated.set(CATEGORY_PARAM.CATEGORY, String(next.categoryId));
        }
        if (next.level === CATEGORY_PARAM.SUBCATEGORY) {
          updated.set(CATEGORY_PARAM.SUBCATEGORY, String(next.subcategoryId));
        }
      }

      // Выбор фильтра имеет смысл только на ленте — иначе параметры
      // потеряются при следующей навигации
      if (next && pathname !== ROUTES.ROOT) {
        navigate({ pathname: ROUTES.ROOT, search: updated.toString() });
      } else {
        setSearchParams(updated);
      }
    },
    [searchParams, setSearchParams, navigate, pathname],
  );

  // Toggle — если выбираем то же что уже выбрано, очищаем
  const toggleSelection = useCallback(
    (next: CategorySelection) => {
      if (isSameSelection(selection, next)) {
        setSelection(null);
      } else {
        setSelection(next);
      }
    },
    [selection, setSelection],
  );

  const clear = useCallback(() => setSelection(null), [setSelection]);

  return {
    selection,
    setSelection,
    toggleSelection,
    clear,
  };
};
