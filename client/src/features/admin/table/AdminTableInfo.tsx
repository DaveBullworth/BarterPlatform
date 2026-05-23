import { ActionIcon, List, Popover } from '@mantine/core';
import { BadgeInfo } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import styles from './AdminTable.module.scss';

/**
 * Кнопка-popover с пояснениями к табличным шорткатам админ-панели.
 * Сам заголовок страницы и текстовое описание живут в AdminPage —
 * здесь только справка по сортировке/ресайзу.
 */
export const AdminTableInfo = () => {
  const { t } = useTranslation();

  return (
    <Popover position="bottom-end" width={260} withArrow>
      <Popover.Target>
        <ActionIcon
          variant="light"
          color="barter"
          size="lg"
          className={styles.pulseIcon}
          aria-label={t('admin.description')}
        >
          <BadgeInfo size={20} />
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
  );
};
