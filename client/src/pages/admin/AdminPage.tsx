import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack,
  Title,
  Text,
  Loader,
  Center,
  Popover,
  List,
  ActionIcon,
  Group,
  Tooltip,
} from '@mantine/core';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { BadgeInfo, ListRestart, Save, SaveOff } from 'lucide-react';
import type { SortingState } from '@tanstack/react-table';

import { AdminTable } from './components/AdminTable';
import { AdminTablePagination } from './components/AdminTablePagination';
import { AdminTableFilters } from './components/AdminTableFilters';
import { getAllUsers } from '@/http/user';
import { TABLES } from '@/shared/constants/tables';
import type { AdminTableRef } from './components/AdminTable';
import type { UserFilters } from '@/types/filters';

import styles from './AdminPage.module.scss';

// Ключ для получения сохраненных сортировок для данной таблицы
const SORTING_STORAGE_KEY = `adminTable:${TABLES.USERS}:sorting`;
const FILTERS_STORAGE_KEY = `adminTable:${TABLES.USERS}:filters`;

export const AdminPage = () => {
  const { t } = useTranslation();

  const tableRef = React.useRef<AdminTableRef>(null);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>(() => {
    try {
      return JSON.parse(localStorage.getItem(SORTING_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [filters, setFilters] = useState<UserFilters>(() => {
    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (!raw) return {};

      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', page, pageSize, sorting, filters],
    queryFn: ({ signal }) =>
      getAllUsers(
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

  const handleResetSorting = () => {
    setSorting([]); // очищаем состояние сортировки в компоненте
  };

  useEffect(() => {
    if (!isLoading && data) {
      const id = requestAnimationFrame(() => setLoading(false));
      return () => cancelAnimationFrame(id); // чистка
    } else {
      const id = setTimeout(() => setLoading(true), 0);
      return () => clearTimeout(id);
    }
  }, [isLoading, data]);

  // Сохраняем в localStorage только при размонтировании страницы
  useEffect(() => {
    return () => {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
      localStorage.setItem(SORTING_STORAGE_KEY, JSON.stringify(sorting));
    };
  }, [sorting, filters]);

  return (
    <Stack gap="md" w={'100%'}>
      <Title order={2}>{t('admin.title')}</Title>

      <div className={styles.adminContainer}>
        <Text c="dimmed">{t('admin.description')}</Text>
        <Popover position="right" width={220} withArrow>
          <Popover.Target>
            <ActionIcon
              variant="light"
              color="blue"
              size="sm"
              className={styles.pulseIcon}
            >
              <BadgeInfo size={22} />
            </ActionIcon>
          </Popover.Target>

          <Popover.Dropdown p={'0.5rem'}>
            <List spacing="xs" size="xs">
              <List.Item>{t('admin.sort.multi')}</List.Item>
              <List.Item>{t('admin.sort.asc')}</List.Item>
              <List.Item>{t('admin.sort.desc')}</List.Item>
              <List.Item>{t('admin.sort.reset')}</List.Item>
              <List.Item>{t('admin.sort.pageSizeTip')}</List.Item>
            </List>
          </Popover.Dropdown>
        </Popover>
      </div>

      {loading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {isError && <Text c="red">{t('admin.loadFailed')}</Text>}

      {!loading && (
        <AdminTableFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
        />
      )}

      {!loading && data && (
        <>
          <Group justify="flex-start">
            {/* Сброс сортировки */}
            {sorting && sorting.length > 0 && (
              <Tooltip label={t('admin.resetSorting')} withArrow position="top">
                <ActionIcon
                  variant="light"
                  size="sm"
                  color="lime"
                  onClick={handleResetSorting}
                  disabled={!sorting || sorting.length === 0}
                >
                  <ListRestart size={18} />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip
              label={t('admin.saveColumnsPreset')}
              withArrow
              position="top"
            >
              <ActionIcon
                variant="light"
                size="sm"
                onClick={() => tableRef.current?.saveColumnSizing()}
              >
                <Save size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip
              label={t('admin.resetColumnsPreset')}
              withArrow
              position="top"
            >
              <ActionIcon
                variant="light"
                size="sm"
                color="red"
                onClick={() => tableRef.current?.resetColumnSizing()}
              >
                <SaveOff size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <AdminTable
            ref={tableRef}
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
