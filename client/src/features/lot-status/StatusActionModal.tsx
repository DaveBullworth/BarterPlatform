import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import type { LotStatusAction } from './useLotStatus';

type Props = {
  action: LotStatusAction | null;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const StatusActionModal = ({
  action,
  loading,
  onConfirm,
  onClose,
}: Props) => {
  const { t } = useTranslation();

  if (!action) return null;

  return (
    <ConfirmModal
      opened
      onCancel={onClose}
      onConfirm={onConfirm}
      title={
        action === 'deactivate'
          ? t('lotForm.actions.deactivate')
          : t('lotForm.actions.unarchive')
      }
      message={
        action === 'deactivate'
          ? t('lotForm.modal.deactivateQuestion')
          : t('lotForm.modal.unarchiveQuestion')
      }
      confirmLabel={t('lotForm.actions.confirm')}
      cancelLabel={t('lotForm.actions.cancel')}
      confirmColor={action === 'deactivate' ? 'red' : 'blue'}
      loading={loading}
    />
  );
};
