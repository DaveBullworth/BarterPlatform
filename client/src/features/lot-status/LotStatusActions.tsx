import { Button } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isLotArchived, type Lot } from '@/entities/lot';
import { StatusActionModal } from './StatusActionModal';
import { useLotStatus, type LotStatusAction } from './useLotStatus';

type Props = {
  lot: Lot;
  // disabled — например когда форма имеет несохранённые изменения
  disabled?: boolean;
  onSuccess?: (lot: Lot) => void;
};

export const LotStatusActions = ({ lot, disabled, onSuccess }: Props) => {
  const { t } = useTranslation();
  const [pendingAction, setPendingAction] = useState<LotStatusAction | null>(
    null,
  );

  const { changeStatus, isPending } = useLotStatus({
    lotId: lot.id,
    onSuccess: (updatedLot) => {
      setPendingAction(null);
      onSuccess?.(updatedLot);
    },
  });

  const archived = isLotArchived(lot.visibilityStatus);

  return (
    <>
      {!archived && (
        <Button
          color="red"
          variant="light"
          loading={isPending}
          disabled={disabled}
          onClick={() => setPendingAction('deactivate')}
        >
          {t('lotForm.actions.deactivate')}
        </Button>
      )}

      {archived && (
        <Button
          loading={isPending}
          disabled={disabled}
          onClick={() => setPendingAction('unarchive')}
        >
          {t('lotForm.actions.unarchive')}
        </Button>
      )}

      <StatusActionModal
        action={pendingAction}
        loading={isPending}
        onClose={() => setPendingAction(null)}
        onConfirm={() => pendingAction && changeStatus(pendingAction)}
      />
    </>
  );
};
