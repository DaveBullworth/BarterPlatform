import { useState, useCallback } from 'react';

const getStorageKey = (tableKey: string) =>
  `adminTable:${tableKey}:columnSizing`;

export const useColumnSizing = (tableKey: string) => {
  const [savedSizing] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(getStorageKey(tableKey)) ?? '{}');
    } catch {
      return {};
    }
  });

  const [columnSizing, setColumnSizing] =
    useState<Record<string, number>>(savedSizing);

  const save = useCallback(() => {
    const clean: Record<string, number> = {};
    for (const [key, value] of Object.entries(columnSizing)) {
      if (typeof value === 'number') clean[key] = value;
    }
    localStorage.setItem(getStorageKey(tableKey), JSON.stringify(clean));
  }, [columnSizing, tableKey]);

  const reset = useCallback(() => {
    setColumnSizing({});
    localStorage.removeItem(getStorageKey(tableKey));
  }, [tableKey]);

  return {
    columnSizing,
    setColumnSizing,
    saveSizing: save,
    resetSizing: reset,
  };
};
