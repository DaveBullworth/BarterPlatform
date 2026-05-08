import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Text } from '@mantine/core';

import { ConfirmModal } from '@/shared/ui';
import { ProfileEditForm } from './ProfileEditForm';
import type { SelfUser, AdminUser } from '@/entities/user';
import type { UserRole } from '@/shared/constants/user-role';

type Props = {
  opened: boolean;
  onClose: () => void;
  user: SelfUser | AdminUser;
  role?: UserRole;
  onUpdated: (user: SelfUser | AdminUser) => void;
};

export const ProfileEditModal = ({
  opened,
  onClose,
  user,
  role,
  onUpdated,
}: Props) => {
  const { t } = useTranslation();
  const [hasChanges, setHasChanges] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const handleClose = () => {
    if (hasChanges) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  };

  const handleSuccess = (updatedUser: SelfUser | AdminUser) => {
    onUpdated(updatedUser);
    onClose();
  };

  return (
    <>
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
        <ProfileEditForm
          user={user}
          role={role}
          onClose={handleClose}
          onSuccess={handleSuccess}
          onHasChangesChange={setHasChanges}
        />
      </Modal>

      <ConfirmModal
        opened={discardOpen}
        onCancel={() => setDiscardOpen(false)}
        onConfirm={() => {
          setHasChanges(false);
          setDiscardOpen(false);
          onClose();
        }}
        title={t('profile.confirmTitle')}
        message={t('profile.confirmDiscardMessage')}
        confirmLabel={t('profile.confirmDiscardConfirm')}
        cancelLabel={t('profile.confirmDiscardCancel')}
      />
    </>
  );
};
