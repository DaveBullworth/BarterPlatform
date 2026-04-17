import { updateLot } from '@/http/lots';
import { handleApiError } from '@/shared/utils/handleApiError';
import { notify } from '@/shared/utils/notifications';
import { LOT_VISIBILITY_STATUS } from '@/types/lot';
import type { TFunction } from 'i18next';

type LotStatusAction = 'deactivate' | 'unarchive';

type ChangeLotStatusParams = {
  lotId: string;
  action: LotStatusAction;
};

export const useLotStatus = ({
  t,
  setLoading,
}: {
  t: TFunction;
  setLoading: (val: boolean) => void;
}) => {
  const changeLotStatus = async ({ lotId, action }: ChangeLotStatusParams) => {
    const isDeactivateAction = action === 'deactivate';

    const nextStatus = isDeactivateAction
      ? LOT_VISIBILITY_STATUS.ARCHIVED
      : LOT_VISIBILITY_STATUS.HIDDEN;

    setLoading(true);

    try {
      const updatedLot = await updateLot(lotId, {
        visibilityStatus: nextStatus,
      });

      notify({
        title: t('common.success'),
        message: isDeactivateAction
          ? t('lotForm.success.deactivated')
          : t('lotForm.success.unarchived'),
        color: 'green',
      });

      return updatedLot;
    } catch (error) {
      handleApiError(error, t);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    changeLotStatus,
  };
};
