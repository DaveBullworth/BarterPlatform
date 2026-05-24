import { Skeleton, Stack } from '@mantine/core';

/**
 * Skeleton-вариант ChapterItem: повторяет визуал
 * (tile-иконка → название → checkbox/chevron справа) из Taxonomy.module.scss,
 * чтобы переход loading → real не "прыгал".
 */
const SkeletonRow = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '10px 12px',
      borderRadius: 10,
      border: '1px solid var(--mantine-color-default-border)',
      background: 'var(--mantine-color-body)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
      <Skeleton height={28} width={28} radius={8} />
      <Skeleton height={14} width="55%" radius="sm" />
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <Skeleton height={16} width={16} radius="sm" />
      <Skeleton height={20} width={20} radius="sm" />
    </div>
  </div>
);

export const CategoriesSkeleton = () => (
  <Stack gap="xs">
    {Array.from({ length: 12 }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </Stack>
);
