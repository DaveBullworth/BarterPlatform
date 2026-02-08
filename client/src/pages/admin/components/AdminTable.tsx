import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, ScrollArea, Group } from '@mantine/core';
import {
  useReactTable,
  getCoreRowModel,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useSelector } from 'react-redux';

import { selectCurrentUser } from '@/store/userSlice';
import { goToUser, goToProfile } from '@/shared/utils/navigation';
import { TABLE_COLUMNS } from '../tables/index';
import type { RootState } from '@/store';
import type { TableKey } from '@/shared/constants/tables';
import type { AdminColumn } from '../tables/user.columns';

import styles from '../AdminPage.module.scss';

type AdminTableProps<T> = {
  tableKey: TableKey;
  data: T[];
  page: number;
  pageSize: number;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
};

export type AdminTableRef = {
  saveColumnSizing: () => void;
  resetColumnSizing: () => void;
};

export const AdminTable = React.forwardRef(function AdminTable<
  T extends { id: string },
>(
  {
    tableKey,
    data,
    page,
    pageSize,
    sorting,
    onSortingChange,
  }: AdminTableProps<T>,
  ref: React.ForwardedRef<AdminTableRef>,
) {
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => selectCurrentUser(s));
  // Функция получения пресета ширины столбцов из LocalStorage
  const getColumnSizingStorageKey = (tableKey: TableKey) =>
    `admin-table:column-sizing:${tableKey}`;

  const savedColumnSizing = React.useMemo<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(getColumnSizingStorageKey(tableKey));
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [tableKey]);

  const [columnSizing, setColumnSizing] = React.useState<
    Record<string, number>
  >(() => savedColumnSizing);

  // Функция сравнения текущего пресета и из LocalStorage
  const isSizingDifferent = (
    a: Record<string, number | undefined>,
    b: Record<string, number>,
  ) => Object.keys(a).some((key) => a[key] !== b[key]);

  // Сохранить пресет ширин столбцов с предварительной проверкой что он новый
  const handleSaveColumnSizing = () => {
    if (!isSizingDifferent(headerSizes, savedColumnSizing)) return;

    const cleanSizing: Record<string, number> = {};
    for (const [key, value] of Object.entries(headerSizes)) {
      if (typeof value === 'number') {
        cleanSizing[key] = value;
      }
    }

    localStorage.setItem(
      getColumnSizingStorageKey(tableKey),
      JSON.stringify(cleanSizing),
    );
  };

  // Сбросить пресет для возврата к ширинам по умолчанию
  const handleResetColumnSizing = () => {
    localStorage.removeItem(getColumnSizingStorageKey(tableKey));
    setColumnSizing({});
    // сброс размеров в TanStack
    table.resetColumnSizing();
  };

  React.useImperativeHandle(ref, () => ({
    saveColumnSizing: handleSaveColumnSizing,
    resetColumnSizing: handleResetColumnSizing,
  }));

  const columns = React.useMemo(
    () => TABLE_COLUMNS[tableKey] as unknown as AdminColumn<T>[],
    [tableKey],
  );

  const columnDefs = React.useMemo(
    () =>
      columns.map((col) => ({
        id: col.id,
        accessorFn:
          col.accessorFn ??
          ((row: T) => (row as T & Record<string, unknown>)[col.id]),
        size: col.width, // стартовый размер
        minSize: col.minWidth,
        enableResizing: col.resizable ?? true,
        enableSorting: col.id !== 'index',
      })),
    [columns],
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: {
      sorting,
      columnSizing: columnSizing, // стартовый пресет
    },
    onSortingChange,
    onColumnSizingChange: setColumnSizing,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    enableMultiSort: true,
    defaultColumn: { size: 150, minSize: 50 },
    columnResizeMode: 'onEnd', // или 'onChange' если нужен live-resize
  });

  const headerSizes = React.useMemo(() => {
    const acc: Record<string, number | undefined> = {};
    for (const col of columns) {
      const rawSize = columnSizing[col.id] ?? col.width;
      const min = col.minWidth ?? 50;

      acc[col.id] = rawSize !== undefined ? Math.max(rawSize, min) : undefined;
    }
    return acc;
  }, [columnSizing, columns]);

  const handleRowClick = <T extends { id: string }>(row: T) => {
    if (row.id === user?.id) {
      goToProfile(navigate);
    } else {
      goToUser(navigate, row.id);
    }
  };

  return (
    <div className={styles.tableWrapper}>
      <ScrollArea>
        <Table striped highlightOnHover withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              {columns.map((col) => {
                const header = table
                  .getHeaderGroups()[0]
                  .headers.find((h) => h.id === col.id);

                const sortState = header?.column.getIsSorted();

                return (
                  <Table.Th
                    key={col.id}
                    onClick={header?.column.getToggleSortingHandler()}
                    style={{
                      cursor: header?.column.getCanSort()
                        ? 'pointer'
                        : 'default',
                      userSelect: 'none',
                      width: headerSizes[col.id]
                        ? `${headerSizes[col.id]}px`
                        : undefined,
                      position: 'relative', // для абсолютного ресайз-хэндла
                    }}
                    className={`
                    ${styles.sortedTh}
                    ${sortState === 'asc' ? styles.sortedAsc : ''}
                    ${sortState === 'desc' ? styles.sortedDesc : ''}
                  `}
                  >
                    <Group
                      gap={6}
                      wrap="nowrap"
                      justify={col.headerAlign ?? 'left'}
                    >
                      {col.header}

                      {sortState === 'asc' && <ChevronUp size={14} />}
                      {sortState === 'desc' && <ChevronDown size={14} />}
                    </Group>

                    {/* resize handle */}
                    {header?.column.getCanResize() && (
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          header.getResizeHandler()(e);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          header.getResizeHandler()(e);
                        }}
                        className={styles.resizer}
                      />
                    )}
                  </Table.Th>
                );
              })}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {data.map((row, rowIndex) => (
              <Table.Tr
                key={rowIndex}
                style={{ cursor: 'pointer' }} // курсор как ссылка
                onClick={() => handleRowClick(row)}
              >
                {columns.map((col) => (
                  <Table.Td
                    key={col.id}
                    style={{
                      width: headerSizes[col.id]
                        ? `${headerSizes[col.id]}px`
                        : undefined,
                      textAlign: col.cellAlign ?? 'left',
                    }}
                  >
                    {col.cell({
                      row,
                      rowIndex,
                      page,
                      pageSize,
                    })}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </div>
  );
});
