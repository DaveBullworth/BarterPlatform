import { ActionIcon, Button, Menu } from '@mantine/core';
import { Archive, ArchiveRestore, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isLotArchived, type Lot } from '@/entities/lot';
import { StatusActionModal } from './StatusActionModal';
import { useLotStatus, type LotStatusAction } from './useLotStatus';
import { useAuthStore } from '@/entities/user';

type Mode = 'buttons' | 'menu';

type Props = {
  lot: Lot;
  /** disabled — например когда форма имеет несохранённые изменения */
  disabled?: boolean;
  onSuccess?: (lot: Lot) => void;
  /**
   * Рендер-режим:
   * - 'buttons' (по умолчанию): отдельные кнопки в ряд (для десктопа)
   * - 'menu': один overflow-trigger с пунктами внутри (для мобильного футера,
   *   где иначе кнопки сваливаются в кучу)
   */
  mode?: Mode;
};

export const LotStatusActions = ({
  lot,
  disabled,
  onSuccess,
  mode = 'buttons',
}: Props) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();

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
  const canDeactivate = !archived && isAuthenticated;
  const canUnarchive = archived && isAuthenticated;

  if (!canDeactivate && !canUnarchive) {
    return null;
  }

  // === Compact menu режим (мобильный футер) ===
  if (mode === 'menu') {
    return (
      <>
        <Menu position="top-end" withArrow withinPortal shadow="md">
          <Menu.Target>
            <ActionIcon
              variant="default"
              size="lg"
              radius="md"
              disabled={disabled || isPending}
              aria-label={t('common.actions')}
            >
              <MoreVertical size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {canDeactivate && (
              <Menu.Item
                color="red"
                leftSection={<Archive size={16} />}
                disabled={disabled || isPending}
                onClick={() => setPendingAction('deactivate')}
              >
                {t('lotForm.actions.deactivate')}
              </Menu.Item>
            )}
            {canUnarchive && (
              <Menu.Item
                leftSection={<ArchiveRestore size={16} />}
                disabled={disabled || isPending}
                onClick={() => setPendingAction('unarchive')}
              >
                {t('lotForm.actions.unarchive')}
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>

        <StatusActionModal
          action={pendingAction}
          loading={isPending}
          onClose={() => setPendingAction(null)}
          onConfirm={() => pendingAction && changeStatus(pendingAction)}
        />
      </>
    );
  }

  // === Стандартный кнопочный режим ===
  return (
    <>
      {canDeactivate && (
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

      {canUnarchive && (
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
