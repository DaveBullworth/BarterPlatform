import { ActionIcon, List, Popover, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BadgeInfo } from 'lucide-react';

import { useFeedFilterSummaries } from './useFeedFilterSummaries';
import styles from './LotsFeed.module.scss';

type Props = {
  lotsOnPage: number;
  totalLots: number;
};

export const FeedInfoPopover = ({ lotsOnPage, totalLots }: Props) => {
  const { t } = useTranslation();
  const { geoSummary, categorySummary, searchSummary } =
    useFeedFilterSummaries();

  return (
    <Popover position="right" width={280} withArrow>
      <Popover.Target>
        <ActionIcon
          variant="light"
          color="barter"
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
              {t('feed.filters.geo')}:
            </Text>{' '}
            <Text span c="dimmed" className={styles.infoValue}>
              {geoSummary}
            </Text>
          </List.Item>
          <List.Item>
            <Text span fw={600}>
              {t('feed.filters.category')}:
            </Text>{' '}
            <Text span c="dimmed" className={styles.infoValue}>
              {categorySummary}
            </Text>
          </List.Item>
          <List.Item>
            <Text span fw={600}>
              {t('feed.filters.search')}:
            </Text>{' '}
            <Text span c="dimmed" className={styles.infoValue}>
              {searchSummary}
            </Text>
          </List.Item>
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
  );
};
