import { ActionIcon, Popover } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BadgeInfo, MapPin, Layers, Search, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';

import { useFeedFilterSummaries } from './useFeedFilterSummaries';
import feedStyles from './LotsFeed.module.scss';
import styles from './FeedInfoPopover.module.scss';

type Props = {
  lotsOnPage: number;
  totalLots: number;
};

type FilterRowProps = {
  icon: ReactNode;
  label: string;
  value: string;
  notSelectedLabel: string;
};

const FilterRow = ({ icon, label, value, notSelectedLabel }: FilterRowProps) => {
  const isActive = value !== notSelectedLabel;

  return (
    <div className={styles.filterRow}>
      <span
        className={`${styles.filterIcon} ${isActive ? styles.filterIconActive : ''}`}
      >
        {icon}
      </span>
      <div className={styles.filterText}>
        <span className={styles.filterLabel}>{label}</span>
        <span
          className={`${styles.filterValue} ${
            !isActive ? styles.filterValueMuted : ''
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  );
};

export const FeedInfoPopover = ({ lotsOnPage, totalLots }: Props) => {
  const { t } = useTranslation();
  const { geoSummary, categorySummary, searchSummary } =
    useFeedFilterSummaries();

  const notSelected = t('feed.filters.notSelected');

  return (
    <Popover
      position="bottom-start"
      width={320}
      withArrow
      shadow="lg"
      transitionProps={{ transition: 'pop', duration: 180 }}
    >
      <Popover.Target>
        <ActionIcon
          variant="light"
          color="barter"
          size="lg"
          radius="md"
          className={feedStyles.pulseIcon}
          aria-label={t('feed.info')}
        >
          <BadgeInfo size={20} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown className={styles.dropdown}>
        <div className={styles.header}>
          <span className={styles.headerIcon}>
            <SlidersHorizontal size={15} strokeWidth={2.2} />
          </span>
          <span className={styles.headerTitle}>{t('feed.info')}</span>
        </div>

        <div className={styles.filters}>
          <FilterRow
            icon={<MapPin size={15} strokeWidth={2} />}
            label={t('feed.filters.geo')}
            value={geoSummary}
            notSelectedLabel={notSelected}
          />
          <FilterRow
            icon={<Layers size={15} strokeWidth={2} />}
            label={t('feed.filters.category')}
            value={categorySummary}
            notSelectedLabel={notSelected}
          />
          <FilterRow
            icon={<Search size={15} strokeWidth={2} />}
            label={t('feed.filters.search')}
            value={searchSummary}
            notSelectedLabel={notSelected}
          />
        </div>

        <div className={styles.stats}>
          <div className={styles.statCell}>
            <span className={styles.statLabel}>{t('feed.recordsOnPage')}</span>
            <span className={styles.statValue}>{lotsOnPage}</span>
          </div>
          <div className={styles.statCell}>
            <span className={styles.statLabel}>{t('feed.recordsTotal')}</span>
            <span className={styles.statValue}>{totalLots}</span>
          </div>
        </div>
      </Popover.Dropdown>
    </Popover>
  );
};
