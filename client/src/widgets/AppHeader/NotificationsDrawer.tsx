import { Drawer, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  opened: boolean;
  onClose: () => void;
};

export const NotificationsDrawer = ({ opened, onClose }: Props) => {
  const { t } = useTranslation();

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="lg"
      title={t('notifications.title')}
    >
      <Text size="sm" c="dimmed">
        {t('notifications.empty')}
      </Text>
    </Drawer>
  );
};
