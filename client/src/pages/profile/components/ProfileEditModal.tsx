import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Text, Alert } from '@mantine/core';

import { ProfileEditForm } from './ProfileEditForm';
import { buildAlertProps } from '@/shared/utils/alertPresets';
import type { AdminUserDto, SelfUserDto } from '@/types/user';

import styles from '../ProfilePage.module.scss';
import type { UserRole } from '@/shared/constants/user-role';

type Props = {
  opened: boolean;
  onClose: () => void;
  user: SelfUserDto | AdminUserDto;
  role?: UserRole;
  onUpdated: (user: SelfUserDto | AdminUserDto) => void;
};

export const ProfileEditModal = ({
  opened,
  onClose,
  user,
  role,
  onUpdated,
}: Props) => {
  const { t } = useTranslation();
  const [alert, setAlert] = useState<React.ReactNode | null>(null);

  const handleClose = () => {
    setAlert(null);
    onClose();
  };

  return (
    <Modal
      mt="sm"
      opened={opened}
      onClose={handleClose}
      centered
      title={
        <Text fw={700} size="lg" td="underline">
          {t('profile.editData')}
        </Text>
      }
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      {alert && (
        <Alert
          mb="sm"
          className={styles.alert}
          onClose={() => setAlert(null)}
          {...buildAlertProps('error', alert)}
        />
      )}
      <div className={styles.modalEditForm}>
        <ProfileEditForm
          user={user}
          role={role}
          onUpdated={onUpdated}
          onClose={handleClose}
        />
      </div>
    </Modal>
  );
};
