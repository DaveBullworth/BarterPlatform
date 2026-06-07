import { Button, Menu } from '@mantine/core';
import {
  Archive,
  ArchiveRestore,
  MoreVertical,
  Pencil,
  UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  StatusActionModal,
  useLotStatus,
  type LotStatusAction,
} from '@/features/lot-status';
import { type Lot, type LotActions as LotActionsType } from '@/entities/lot';
import { useNavigation } from '@/shared/lib/navigation';

type Props = {
  lot: Lot;
  actions: LotActionsType;
  isAdmin: boolean;
};

export const LotActions = ({ lot, actions, isAdmin }: Props) => {
  const { t } = useTranslation();
  const { toUser, toLotEdit } = useNavigation();

  const [pendingAction, setPendingAction] = useState<LotStatusAction | null>(
    null,
  );

  const { changeStatus, isPending } = useLotStatus({
    lotId: lot.id,
    onSuccess: () => setPendingAction(null),
  });

  // Действия видны только тем, у кого есть права (владелец/админ),
  // а не любому авторизованному пользователю.
  const showDeactivate = actions.canDeactivate;
  const showUnarchive = actions.canUnarchive;

  const hasItems =
    isAdmin || actions.canEdit || showDeactivate || showUnarchive;

  if (!hasItems) return null;

  return (
    <>
      <Menu shadow="md" position="bottom-end" withinPortal>
        <Menu.Target>
          <Button
            variant="default"
            leftSection={<MoreVertical size={16} />}
            style={{ alignItems: 'center' }}
          >
            {t('common.actions')}
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          {isAdmin && (
            <Menu.Item
              leftSection={<UserRound size={16} />}
              onClick={() => toUser(lot.userId)}
            >
              {t('lot.owner')}
            </Menu.Item>
          )}

          {actions.canEdit && (
            <Menu.Item
              leftSection={<Pencil size={16} />}
              onClick={() => toLotEdit(lot.id)}
            >
              {t('lot.edit')}
            </Menu.Item>
          )}

          {showDeactivate && (
            <Menu.Item
              color="red"
              leftSection={<Archive size={16} />}
              disabled={isPending}
              onClick={() => setPendingAction('deactivate')}
            >
              {t('lotForm.actions.deactivate')}
            </Menu.Item>
          )}

          {showUnarchive && (
            <Menu.Item
              leftSection={<ArchiveRestore size={16} />}
              disabled={isPending}
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
};
