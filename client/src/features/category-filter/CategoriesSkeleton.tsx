import { Skeleton, Stack, Group } from '@mantine/core';

const SkeletonRow = () => (
  <Stack gap={0}>
    <Group
      justify="space-between"
      wrap="nowrap"
      gap="sm"
      style={{
        borderRadius: 10,
        border: '1px solid var(--mantine-color-gray-3)',
        padding: '8px 10px',
      }}
    >
      <Group wrap="nowrap" gap="xs">
        <Skeleton height={22} width={22} radius="sm" />
        <Skeleton height={12} width={120} radius="sm" />
      </Group>
      <Group gap="xs" wrap="nowrap">
        <Skeleton height={16} width={16} radius="sm" />
        <Skeleton height={16} width={16} radius="sm" />
      </Group>
    </Group>
  </Stack>
);

export const CategoriesSkeleton = () => (
  <Stack gap="sm">
    {Array.from({ length: 16 }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </Stack>
);
