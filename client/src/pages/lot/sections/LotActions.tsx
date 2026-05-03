import { Button, Group } from '@mantine/core';
import { Pencil, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useNavigation } from '@/shared/lib/navigation';
import { LotStatusActions } from '@/features/lot-status';
import type { Lot, LotActions as LotActionsType } from '@/entities/lot';

type Props = {
  lot: Lot;
  actions: LotActionsType;
  isAdmin: boolean;
};

export const LotActions = ({ lot, actions, isAdmin }: Props) => {
  const { t } = useTranslation();
  const { toUser, toLotEdit } = useNavigation();

  return (
    <Group>
      {isAdmin && (
        <Button
          leftSection={<UserRound size={16} />}
          variant="default"
          onClick={() => toUser(lot.userId)}
        >
          {t('lot.owner')}
        </Button>
      )}

      {actions.canEdit && (
        <Button
          leftSection={<Pencil size={16} />}
          onClick={() => toLotEdit(lot.id)}
        >
          {t('lot.edit')}
        </Button>
      )}

      <LotStatusActions lot={lot} />
    </Group>
  );
};
