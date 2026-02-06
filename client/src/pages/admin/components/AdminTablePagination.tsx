import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Group, Pagination, Text, NumberInput } from '@mantine/core';

type AdminTablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  sortingEmpty?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onResetSorting?: () => void;
};

export function AdminTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: AdminTablePaginationProps) {
  const { t } = useTranslation();

  const totalPages = Math.ceil(total / pageSize);

  const [localPageSize, setLocalPageSize] = useState(pageSize);

  return (
    <Group justify="space-between">
      <Text size="sm" c="dimmed">
        {t('admin.totalRecords', { count: total })}
      </Text>

      <Group gap="md">
        <Pagination value={page} onChange={onPageChange} total={totalPages} />

        <NumberInput
          value={localPageSize}
          onChange={(val) => {
            // приводим к числу или 1, если пусто/NaN
            const num = typeof val === 'number' && !isNaN(val) ? val : 1;
            setLocalPageSize(num);
          }}
          onBlur={() => {
            // корректируем значение только при потере фокуса
            const newSize =
              localPageSize && !isNaN(localPageSize)
                ? Math.min(Math.max(localPageSize, 1), total)
                : 1;

            setLocalPageSize(newSize);
            onPageSizeChange(newSize);
          }}
          min={1}
          max={total}
          size="sm"
          hideControls
          placeholder={t('admin.pageSize')}
          style={{ width: 80 }}
        />
      </Group>
    </Group>
  );
}
