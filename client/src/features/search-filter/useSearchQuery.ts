import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { ROUTES } from '@/shared/constants/routes';

const PARAM_SEARCH = 'q';

export const useSearchQuery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const query = searchParams.get(PARAM_SEARCH) ?? '';

  const setQuery = useCallback(
    (value: string) => {
      const updated = new URLSearchParams(searchParams);
      const trimmed = value.trim();

      if (trimmed) {
        updated.set(PARAM_SEARCH, trimmed);
      } else {
        updated.delete(PARAM_SEARCH);
      }

      // Поиск имеет смысл только на ленте — иначе параметр
      // потеряется при следующей навигации
      if (trimmed && pathname !== ROUTES.ROOT) {
        navigate({ pathname: ROUTES.ROOT, search: updated.toString() });
      } else {
        setSearchParams(updated);
      }
    },
    [searchParams, setSearchParams, navigate, pathname],
  );

  const clear = useCallback(() => setQuery(''), [setQuery]);

  return {
    query,
    setQuery,
    clear,
  };
};
