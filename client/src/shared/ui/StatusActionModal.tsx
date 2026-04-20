import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import type { TFunction } from 'i18next';

export type LotStatusAction = 'deactivate' | 'unarchive';

type Props = {
  action: 'deactivate' | 'unarchive' | null;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
  t: TFunction;
};

const StatusActionModal = ({
  action,
  loading,
  onConfirm,
  onClose,
  t,
}: Props) => {
  return (
    <Modal
      opened={action !== null}
      onClose={onClose}
      title={
        <Text fw={700} size="lg" td="underline">
          {action === 'deactivate'
            ? t('lotForm.actions.deactivate')
            : t('lotForm.actions.unarchive')}
        </Text>
      }
      centered
    >
      <Stack>
        <Text>
          {action === 'deactivate'
            ? t('lotForm.modal.deactivateQuestion')
            : t('lotForm.modal.unarchiveQuestion')}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t('lotForm.actions.cancel')}
          </Button>
          <Button
            color={action === 'deactivate' ? 'red' : undefined}
            loading={loading}
            onClick={onConfirm}
          >
            {t('lotForm.actions.confirm')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default StatusActionModal;
