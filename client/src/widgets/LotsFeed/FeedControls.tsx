import {
  Group,
  Pagination,
  Paper,
  SegmentedControl,
  Select,
  Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, LayoutList, ListOrdered } from 'lucide-react';

import { FeedInfoPopover } from './FeedInfoPopover';

export type FeedView = 'grid' | 'list';
export type LimitOption = '5' | '10' | '20';

const LIMIT_OPTIONS: LimitOption[] = ['5', '10', '20'];

type Props = {
  view: FeedView;
  onViewChange: (view: FeedView) => void;
  limitValue: LimitOption;
  onLimitChange: (value: LimitOption) => void;
  page: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  lotsOnPage: number;
  totalLots: number;
};

export const FeedControls = ({
  view,
  onViewChange,
  limitValue,
  onLimitChange,
  page,
  onPageChange,
  totalPages,
  lotsOnPage,
  totalLots,
}: Props) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 48em)');

  return (
    <Paper
      p="xs"
      radius="lg"
      withBorder
      shadow="xs"
      bg="var(--mantine-color-body)"
    >
      <Group justify="space-between" align="center" gap="sm" wrap="wrap">
        <Group align="center" gap="sm" wrap="wrap">
          <FeedInfoPopover lotsOnPage={lotsOnPage} totalLots={totalLots} />

          <Group gap={6} wrap="nowrap" align="center">
            <ListOrdered size={16} color="var(--mantine-color-dimmed)" />
            <Select
              checkIconPosition="right"
              w={72}
              size="sm"
              data={LIMIT_OPTIONS.map((v) => ({ value: v, label: v }))}
              value={limitValue}
              onChange={(v) => onLimitChange((v as LimitOption) || '5')}
              allowDeselect={false}
            />
          </Group>

          <Pagination
            value={page}
            onChange={onPageChange}
            total={totalPages}
            size={isMobile ? 'sm' : 'sm'}
            withEdges={!isMobile}
            siblings={isMobile ? 0 : 1}
          />

          {!isMobile && totalLots > 0 && (
            <Text size="xs" c="dimmed">
              {t('feed.recordsTotal')}:{' '}
              <Text component="span" fw={600}>
                {totalLots}
              </Text>
            </Text>
          )}
        </Group>

        <SegmentedControl
          value={view}
          onChange={(v) => onViewChange(v as FeedView)}
          size="sm"
          data={[
            {
              value: 'grid',
              label: isMobile ? (
                <LayoutGrid size={16} />
              ) : (
                <Group gap={6} wrap="nowrap" w="max-content">
                  <LayoutGrid size={16} /> {t('feed.view.grid')}
                </Group>
              ),
            },
            {
              value: 'list',
              label: isMobile ? (
                <LayoutList size={16} />
              ) : (
                <Group gap={6} wrap="nowrap" w="max-content">
                  <LayoutList size={16} /> {t('feed.view.list')}
                </Group>
              ),
            },
          ]}
        />
      </Group>
    </Paper>
  );
};
