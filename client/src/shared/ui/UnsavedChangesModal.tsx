import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import type { TFunction } from 'i18next';

type Props = {
  opened: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  t: TFunction;
};

const UnsavedChangesModal = ({ opened, onConfirm, onCancel, t }: Props) => {
  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title={t('lotForm.status.unsaved')}
      centered
    >
      <Stack>
        <Text>{t('lotForm.modal.unsavedWarning')}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            {t('lotForm.actions.cancel')}
          </Button>
          <Button color="red" onClick={onConfirm}>
            {t('lotForm.actions.continue')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default UnsavedChangesModal;
