import { Table, ScrollArea, Group } from '@mantine/core';
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
  const columns = TABLE_COLUMNS[tableKey] as AdminColumn<T>[];

  // eslint-disable-next-line
  const table = useReactTable({
    data,
    columns: columns.map((col) => ({
      id: col.id,
      accessorKey: col.id,
      enableSorting: col.id !== 'index', // № не сортируем
    })),
    state: {
      sorting,
    },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <ScrollArea>
      <Table striped highlightOnHover withColumnBorders horizontalSpacing="md">
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
                  w={col.width}
                  onClick={header?.column.getToggleSortingHandler()}
                  style={{
                    textAlign: col.headerAlign ?? 'left',
                    cursor: header?.column.getCanSort() ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                >
                  <Group gap={6} wrap="nowrap">
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
