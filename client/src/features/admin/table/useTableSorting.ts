import { useState, useCallback } from 'react';
import type { SortingState, OnChangeFn } from '@tanstack/react-table';

const getStorageKey = (tableKey: string) => `adminTable:${tableKey}:sorting`;

export const useTableSorting = (tableKey: string) => {
  const [sorting, setSorting] = useState<SortingState>(() => {
    try {
      return JSON.parse(localStorage.getItem(getStorageKey(tableKey)) ?? '[]');
    } catch {
      return [];
    }
  });

  const onSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      setSorting((old) => {
        const next = typeof updater === 'function' ? updater(old) : updater;
        localStorage.setItem(getStorageKey(tableKey), JSON.stringify(next));
        return next;
      });
    },
    [tableKey],
  );

  const resetSorting = useCallback(() => {
    setSorting([]);
    localStorage.removeItem(getStorageKey(tableKey));
  }, [tableKey]);

  return {
    sorting,
    onSortingChange,
    resetSorting,
    hasSorting: sorting.length > 0,
  };
};
