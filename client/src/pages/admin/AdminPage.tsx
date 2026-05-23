import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Title, Text, Loader, Center, Group } from '@mantine/core';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { userApi, useAuthStore } from '@/entities/user';
import { useNavigation } from '@/shared/lib/navigation';
import { TABLES } from '@/shared/constants/tables';
import { AdminTableFilters, useAdminFilters } from '@/features/admin/filters';
import {
  AdminTable,
  AdminTableInfo,
  AdminTablePagination,
  AdminTableActions,
} from '@/features/admin/table';
import { useTableSorting, useColumnSizing } from '@/features/admin/table';
import { getUserColumns } from '@/features/admin/columns';

export const AdminPage = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuthStore();
  const { toUser, toProfile } = useNavigation();

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { sorting, onSortingChange, resetSorting, hasSorting } =
    useTableSorting(TABLES.USERS);

  const { columnSizing, setColumnSizing, saveSizing, resetSizing } =
    useColumnSizing(TABLES.USERS);

  const {
    committed: filters,
    local: localFilters,
    setLocal: setLocalFilters,
    activeCount: activeFiltersCount,
    apply: applyFilters,
    reset: resetFilters,
  } = useAdminFilters(TABLES.USERS);

  const columns = useMemo(() => getUserColumns(t), [t]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', page, pageSize, sorting, filters],
    queryFn: ({ signal }) =>
      userApi.getAll(
        {
          page,
          limit: pageSize,
          sorting: sorting.length ? JSON.stringify(sorting) : undefined,
          filters: Object.keys(filters).length
            ? JSON.stringify(filters)
            : undefined,
        },
        signal,
      ),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!isLoading && data) {
      const id = requestAnimationFrame(() => setLoading(false));
      return () => cancelAnimationFrame(id);
    } else {
      const id = setTimeout(() => setLoading(true), 0);
      return () => clearTimeout(id);
    }
  }, [isLoading, data]);

  const handleRowClick = (row: { id: string }) => {
    if (row.id === currentUser?.id) {
      toProfile();
    } else {
      toUser(row.id);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  return (
    <Stack gap="md" w="100%">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={2}>
          <Title order={2}>{t('admin.title')}</Title>
          <Text size="sm" c="dimmed">
            {t('admin.description')}
          </Text>
        </Stack>
        <AdminTableInfo />
      </Group>

      {loading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {isError && <Text c="red">{t('admin.loadFailed')}</Text>}

      {!loading && (
        <AdminTableFilters
          local={localFilters}
          onChange={setLocalFilters}
          activeCount={activeFiltersCount}
          onApply={() => {
            applyFilters();
            setPage(1);
          }}
          onReset={() => {
            resetFilters();
            setPage(1);
          }}
        />
      )}

      {!loading && data && (
        <>
          <AdminTableActions
            hasSorting={hasSorting}
            onResetSorting={resetSorting}
            onSaveSizing={saveSizing}
            onResetSizing={resetSizing}
          />

          <AdminTable
            columns={columns}
            data={data.data}
            page={page}
            pageSize={pageSize}
            sorting={sorting}
            onSortingChange={(updater) => {
              onSortingChange(updater);
              setPage(1);
            }}
            columnSizing={columnSizing}
            onColumnSizingChange={setColumnSizing}
            onRowClick={handleRowClick}
          />

          <AdminTablePagination
            page={page}
            pageSize={pageSize}
            total={data.total}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </Stack>
  );
};
