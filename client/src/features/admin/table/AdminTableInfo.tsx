import { ActionIcon, List, Popover, Text } from '@mantine/core';
import { BadgeInfo } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import styles from './AdminTable.module.scss';

export const AdminTableInfo = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.adminContainer}>
      <Text c="dimmed">{t('admin.description')}</Text>
      <Popover position="right" width={220} withArrow>
        <Popover.Target>
          <ActionIcon
            variant="light"
            color="blue"
            size="sm"
            className={styles.pulseIcon}
          >
            <BadgeInfo size={22} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown p="0.5rem">
          <List spacing="xs" size="xs">
            <List.Item>{t('admin.sort.multi')}</List.Item>
            <List.Item>{t('admin.sort.asc')}</List.Item>
            <List.Item>{t('admin.sort.desc')}</List.Item>
            <List.Item>{t('admin.sort.reset')}</List.Item>
            <List.Item>{t('admin.sort.pageSizeTip')}</List.Item>
          </List>
        </Popover.Dropdown>
      </Popover>
    </div>
  );
};
