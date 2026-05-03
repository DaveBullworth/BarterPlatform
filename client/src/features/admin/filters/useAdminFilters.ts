import { useState, useMemo, useCallback } from 'react';
import type { UserFilters } from '@/entities/user';

const getStorageKey = (tableKey: string) => `adminTable:${tableKey}:filters`;

const filtersEqual = (a: UserFilters, b: UserFilters): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

export const useAdminFilters = (tableKey: string) => {
  const [committed, setCommitted] = useState<UserFilters>(() => {
    try {
      const raw = localStorage.getItem(getStorageKey(tableKey));
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  });

  const [local, setLocal] = useState<UserFilters>(() => ({ ...committed }));

  const activeCount = useMemo(
    () =>
      Object.values(committed).filter((f) => f !== undefined && f !== null)
        .length,
    [committed],
  );

  const isDirty = !filtersEqual(local, committed);

  const apply = useCallback(() => {
    if (!filtersEqual(local, committed)) {
      setCommitted(local);
      localStorage.setItem(getStorageKey(tableKey), JSON.stringify(local));
    }
  }, [local, committed, tableKey]);

  const reset = useCallback(() => {
    const empty: UserFilters = {};
    setLocal(empty);
    setCommitted(empty);
    localStorage.removeItem(getStorageKey(tableKey));
  }, [tableKey]);

  return {
    committed,
    local,
    setLocal,
    activeCount,
    isDirty,
    apply,
    reset,
  };
};
