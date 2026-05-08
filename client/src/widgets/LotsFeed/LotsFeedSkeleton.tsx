import { Card, Group, SimpleGrid, Skeleton, Stack } from '@mantine/core';

import styles from './LotsFeed.module.scss';
import type { FeedView } from './FeedControls';

type Props = {
  view: FeedView;
  count: number;
  cols: number;
};

const GridSkeletonCard = () => (
  <Card withBorder padding="sm">
    <Stack className={styles.gridCard}>
      <Skeleton
        radius="sm"
        style={{ aspectRatio: '1 / 1', height: '70%' }}
      />
      <Stack gap={4}>
        <Skeleton height={18} width="80%" radius="sm" />
        <Skeleton height={14} width="100%" radius="sm" mt={4} />
        <Skeleton height={14} width="60%" radius="sm" />
        <Group justify="space-between" gap="xs" mt={4}>
          <Skeleton height={12} width={70} radius="sm" />
          <Skeleton height={12} width={20} radius="sm" />
        </Group>
      </Stack>
      <Skeleton mt="auto" height={36} radius="sm" />
    </Stack>
  </Card>
);

const ListSkeletonCard = () => (
  <Card withBorder padding="sm">
    <Group wrap="nowrap" align="stretch">
      <Skeleton
        width={100}
        height={100}
        radius="sm"
        style={{ minWidth: 100, flexShrink: 0 }}
      />
      <Stack gap={6} className={styles.listCardBody}>
        <Skeleton height={20} width="60%" radius="sm" />
        <Skeleton height={14} width="100%" radius="sm" />
        <Skeleton height={14} width="80%" radius="sm" />
        <Group justify="space-between" mt="auto">
          <Skeleton height={12} width={70} radius="sm" />
          <Skeleton height={12} width={20} radius="sm" />
        </Group>
      </Stack>
      <Skeleton
        width={32}
        height={32}
        radius="sm"
        className={styles.listAction}
      />
    </Group>
  </Card>
);

export const LotsFeedSkeleton = ({ view, count, cols }: Props) => {
  if (view === 'grid') {
    return (
      <SimpleGrid cols={cols} spacing="md" verticalSpacing="md">
        {Array.from({ length: count }).map((_, i) => (
          <GridSkeletonCard key={i} />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <Stack gap="sm">
      {Array.from({ length: count }).map((_, i) => (
        <ListSkeletonCard key={i} />
      ))}
    </Stack>
  );
};
