import { Table, ScrollArea, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  useReactTable,
  getCoreRowModel,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';

import { TABLE_COLUMNS } from '../tables/index';
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

export function AdminTable<T>({
  tableKey,
  data,
  page,
  pageSize,
  sorting,
  onSortingChange,
}: AdminTableProps<T>) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const columns = TABLE_COLUMNS[tableKey] as AdminColumn<T>[];

  // eslint-disable-next-line
  const table = useReactTable({
    data,
    columns: columns.map((col) => ({
      id: col.id,
      accessorFn:
        col.accessorFn ??
        ((row) => (row as T & Record<string, unknown>)[col.id]),
      enableSorting: col.id !== 'index',
    })),
    state: {
      sorting,
    },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    enableMultiSort: true,
  });

  return (
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
                  w={isMobile ? (col.width ?? col.minWidth) : col.width}
                  onClick={header?.column.getToggleSortingHandler()}
                  style={{
                    cursor: header?.column.getCanSort() ? 'pointer' : 'default',
                    userSelect: 'none',
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
                </Table.Th>
              );
            })}
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {data.map((row, rowIndex) => (
            <Table.Tr key={rowIndex}>
              {columns.map((col) => (
                <Table.Td
                  key={col.id}
                  style={{
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
  );
}
