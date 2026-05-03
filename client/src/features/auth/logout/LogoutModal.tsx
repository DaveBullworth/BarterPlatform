import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '@/shared/ui';
import { useLogout } from './useLogout';

type Props = {
  opened: boolean;
  onClose: () => void;
};

export const LogoutModal = ({ opened, onClose }: Props) => {
  const { t } = useTranslation();
  const { logout, isLoading } = useLogout({ onSuccess: onClose });

  return (
    <ConfirmModal
      opened={opened}
      onCancel={onClose}
      onConfirm={logout}
      title={t('common.exit')}
      message={t('common.exitQuestion')}
      confirmLabel={t('common.exit')}
      cancelLabel={t('authRequired.cancel')}
      loading={isLoading}
    />
  );
};
