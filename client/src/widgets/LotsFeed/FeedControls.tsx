import {
  ActionIcon,
  Group,
  List,
  Pagination,
  Popover,
  SegmentedControl,
  Select,
  Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { BadgeInfo, LayoutGrid, LayoutList, ListOrdered } from 'lucide-react';

import styles from './LotsFeed.module.scss';

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
    <Group justify="space-between" align="end" gap="sm">
      <Group className={styles.feedMeta} align="center">
        <Popover position="right" width={280} withArrow>
          <Popover.Target>
            <ActionIcon
              variant="light"
              color="blue"
              size="sm"
              className={styles.pulseIcon}
              aria-label={t('feed.info')}
            >
              <BadgeInfo size={22} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown p="0.5rem">
            <List spacing="xs" size="xs">
              <List.Item>
                <Text span fw={600}>
                  {t('feed.recordsOnPage')}:
                </Text>{' '}
                <Text span c="dimmed">
                  {lotsOnPage}
                </Text>
              </List.Item>
              <List.Item>
                <Text span fw={600}>
                  {t('feed.recordsTotal')}:
                </Text>{' '}
                <Text span c="dimmed">
                  {totalLots}
                </Text>
              </List.Item>
            </List>
          </Popover.Dropdown>
        </Popover>

        <Group gap="xs">
          <ListOrdered />
          <Select
            checkIconPosition="right"
            w={70}
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
          size={isMobile ? 'sm' : 'md'}
        />
      </Group>

      <SegmentedControl
        value={view}
        onChange={(v) => onViewChange(v as FeedView)}
        data={[
          {
            value: 'grid',
            label: isMobile ? (
              <LayoutGrid />
            ) : (
              <Group gap="xs" w="max-content">
                <LayoutGrid /> {t('feed.view.grid')}
              </Group>
            ),
          },
          {
            value: 'list',
            label: isMobile ? (
              <LayoutList />
            ) : (
              <Group gap="xs" w="max-content">
                <LayoutList /> {t('feed.view.list')}
              </Group>
            ),
          },
        ]}
      />
    </Group>
  );
};
