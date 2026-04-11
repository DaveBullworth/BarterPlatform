import { Skeleton, Stack, Group } from '@mantine/core';

const ChapterItemSkeleton = () => {
  return (
    <Stack gap={0}>
      <div
        style={{
          borderRadius: 10,
          border: '1px solid var(--mantine-color-gray-3)',
          padding: '8px 10px',
        }}
      >
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group wrap="nowrap" gap="xs">
            {/* иконка */}
            <Skeleton height={22} width={22} radius="sm" />

            {/* текст */}
            <Skeleton height={12} width={120} radius="sm" />
          </Group>

          <Group gap="xs" wrap="nowrap">
            {/* стрелка */}
            <Skeleton height={16} width={16} radius="sm" />

            {/* чекбокс/правый слот */}
            <Skeleton height={16} width={16} radius="sm" />
          </Group>
        </Group>
      </div>
    </Stack>
  );
};

export const SkeletonList = () => {
  return (
    <Stack gap="sm">
      {Array.from({ length: 16 }).map((_, i) => (
        <ChapterItemSkeleton key={i} />
      ))}
    </Stack>
  );
};
