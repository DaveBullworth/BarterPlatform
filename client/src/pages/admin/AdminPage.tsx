import { Stack, Title, Text, Loader, Center } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';

import { AdminTable } from './components/AdminTable';
import { AdminTablePagination } from './components/AdminTablePagination';

import { getAllUsers } from '@/http/user';
import { TABLES } from '@/shared/constants/tables';

import styles from './AdminPage.module.scss';

export const AdminPage = () => {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', page, pageSize, sorting],
    queryFn: () =>
      getAllUsers({
        page,
        limit: pageSize,
        sorting,
      }),
    placeholderData: (previousData) => previousData,
  });

  return (
    <Stack gap="md" w={'100%'}>
      <Title order={2}>{t('admin.title')}</Title>
      <Text c="dimmed">{t('admin.description')}</Text>

      {isLoading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {isError && <Text c="red">{t('admin.loadFailed')}</Text>}

      {!isLoading && data && (
        <>
          <div className={styles.tableWrapper}>
            <AdminTable
              tableKey={TABLES.USERS}
              data={data.data}
              page={page}
              pageSize={pageSize}
              sorting={sorting}
              onSortingChange={(updater) => {
                setSorting((old) =>
                  typeof updater === 'function' ? updater(old) : updater,
                );
                setPage(1);
              }}
            />
          </div>
          <AdminTablePagination
            page={page}
            pageSize={pageSize}
            total={data.total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1); // сброс на первую страницу при смене размера
            }}
          />
        </>
      )}
    </Stack>
  );
};
