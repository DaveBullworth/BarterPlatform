import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  lotKeys,
  lotApi,
  LOT_STATUS,
  type Lot,
  type LotStatus,
} from '@/entities/lot';
import { handleApiError, notify } from '@/shared/lib';

export type LotStatusAction = 'deactivate' | 'unarchive';

const ACTION_TO_STATUS: Record<LotStatusAction, LotStatus> = {
  deactivate: LOT_STATUS.ARCHIVED,
  unarchive: LOT_STATUS.HIDDEN,
};

const ACTION_TO_SUCCESS_KEY: Record<LotStatusAction, string> = {
  deactivate: 'lotForm.success.deactivated',
  unarchive: 'lotForm.success.unarchived',
};

type UseLotStatusOptions = {
  lotId: string;
  onSuccess?: (lot: Lot) => void;
};

export const useLotStatus = ({ lotId, onSuccess }: UseLotStatusOptions) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (action: LotStatusAction): Promise<Lot> => {
      return lotApi.update(lotId, {
        visibilityStatus: ACTION_TO_STATUS[action],
      });
    },
    onSuccess: (updatedLot, action) => {
      queryClient.setQueryData(lotKeys.detail(lotId), updatedLot);
      queryClient.invalidateQueries({ queryKey: lotKeys.lists() });

      notify({
        title: t('common.success'),
        message: t(ACTION_TO_SUCCESS_KEY[action]),
        color: 'green',
      });

      onSuccess?.(updatedLot);
    },
    onError: (error) => handleApiError(error, t),
  });

  return {
    changeStatus: mutate,
    isPending,
  };
};
