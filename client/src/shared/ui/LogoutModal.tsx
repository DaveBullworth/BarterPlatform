import { Button, Group, Modal, Text } from '@mantine/core';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { handleApiError } from '../utils/handleApiError';
import { logout as logoutAction } from '@/store/userSlice';
import { logoutUser } from '@/http/user';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export const LogoutModal = ({ opened, onClose }: Props) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await logoutUser();
      dispatch(logoutAction()); // чистим Redux state
      onClose();
    } catch (err) {
      console.error(err);
      onClose();
      handleApiError(err, t, { defaultMessage: t('common.logoutFailed') });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      title={
        <Text fw={700} size="lg" td="underline">
          {t('common.exit')}
        </Text>
      }
    >
      <Text mb="md">{t('common.exitQuestion')}</Text>
      <Group justify="flex-end" mt="md" gap="xs">
        <Button variant="default" onClick={onClose}>
          {t('authRequired.cancel')}
        </Button>
        <Button color="red" onClick={handleLogout}>
          {t('common.exit')}
        </Button>
      </Group>
    </Modal>
  );
};
