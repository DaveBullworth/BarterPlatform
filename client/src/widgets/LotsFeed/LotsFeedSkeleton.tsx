import { Card, Group, SimpleGrid, Skeleton, Stack } from '@mantine/core';

import styles from './LotsFeed.module.scss';
import type { FeedView } from './FeedControls';

type Props = {
  view: FeedView;
  count: number;
  cols: number;
};

const GridSkeletonCard = () => (
  <Card padding="sm">
    <Stack className={styles.gridCard}>
      <Skeleton style={{ aspectRatio: '1 / 1', width: '100%' }} radius="md" />
      <Stack gap={6}>
        <Skeleton height={18} radius="sm" />
        <Skeleton height={14} width="90%" radius="sm" />
        <Skeleton height={14} width="60%" radius="sm" />
      </Stack>
      <Group justify="space-between" gap="xs">
        <Skeleton height={12} width={110} radius="sm" />
        <Skeleton height={12} width={48} radius="sm" />
      </Group>
      <Skeleton mt="auto" height={34} radius="md" />
    </Stack>
  </Card>
);

const ListSkeletonCard = () => (
  <Card className={styles.listCard}>
    <Group wrap="nowrap" align="stretch" gap="md">
      <Skeleton width={96} height={96} radius="md" style={{ flexShrink: 0 }} />
      <Stack gap={8} className={styles.listCardBody}>
        <Skeleton height={18} width="55%" radius="sm" />
        <Skeleton height={14} width="100%" radius="sm" />
        <Skeleton height={14} width="80%" radius="sm" />
        <Group justify="space-between" mt="auto">
          <Skeleton height={12} width={120} radius="sm" />
          <Skeleton height={12} width={48} radius="sm" />
        </Group>
      </Stack>
      <Skeleton
        width={36}
        height={36}
        radius="md"
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
