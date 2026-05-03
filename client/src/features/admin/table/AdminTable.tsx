import { useMemo } from 'react';
import { Table, ScrollArea, Group } from '@mantine/core';
import {
  useReactTable,
  getCoreRowModel,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';

import type { ColumnDef } from '../columns/userColumns';
import styles from './AdminTable.module.scss';

type Props<T extends { id: string }> = {
  columns: ColumnDef<T>[];
  data: T[];
  page: number;
  pageSize: number;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  columnSizing: Record<string, number>;
  onColumnSizingChange: (sizing: Record<string, number>) => void;
  onRowClick: (row: T) => void;
};

export const AdminTable = <T extends { id: string }>({
  columns,
  data,
  page,
  pageSize,
  sorting,
  onSortingChange,
  columnSizing,
  onColumnSizingChange,
  onRowClick,
}: Props<T>) => {
  const columnDefs = useMemo(
    () =>
      columns.map((col) => ({
        id: col.id,
        accessorFn:
          col.accessorFn ??
          ((row: T) => (row as Record<string, unknown>)[col.id]),
        size: col.width,
        minSize: col.minWidth,
        enableResizing: col.resizable ?? true,
        enableSorting: col.id !== 'index',
      })),
    [columns],
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: { sorting, columnSizing },
    onSortingChange,
    onColumnSizingChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(columnSizing) : updater;
      onColumnSizingChange(next);
    },
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    enableMultiSort: true,
    defaultColumn: { size: 150, minSize: 50 },
    columnResizeMode: 'onEnd',
  });

  const headerSizes = useMemo(() => {
    const acc: Record<string, number | undefined> = {};
    for (const col of columns) {
      const raw = columnSizing[col.id] ?? col.width;
      const min = col.minWidth ?? 50;
      acc[col.id] = raw !== undefined ? Math.max(raw, min) : undefined;
    }
    return acc;
  }, [columnSizing, columns]);

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
                      position: 'relative',
                    }}
                    className={
                      sortState === 'asc'
                        ? styles.sortedAsc
                        : sortState === 'desc'
                          ? styles.sortedDesc
                          : undefined
                    }
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
                key={row.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onRowClick(row)}
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
                    {col.cell({ row, rowIndex, page, pageSize })}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </div>
  );
};
