import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

const PARAM_SEARCH = 'q';

export const useSearchQuery = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get(PARAM_SEARCH) ?? '';

  const setQuery = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const updated = new URLSearchParams(prev);
        const trimmed = value.trim();

        if (trimmed) {
          updated.set(PARAM_SEARCH, trimmed);
        } else {
          updated.delete(PARAM_SEARCH);
        }

        return updated;
      });
    },
    [setSearchParams],
  );

  const clear = useCallback(() => setQuery(''), [setQuery]);

  return {
    query,
    setQuery,
    clear,
  };
};
