import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  opened: boolean;
  onConfirm: () => void;
  onCancel: () => void;

  title?: ReactNode;
  message?: ReactNode;

  confirmLabel?: string;
  cancelLabel?: string;

  confirmColor?: string;
  loading?: boolean;
};

const ConfirmModal = ({
  opened,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'red',
  loading = false,
}: Props) => {
  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title={
        <Text fw={700} size="lg" td="underline">
          {title}
        </Text>
      }
      centered
    >
      <Stack>
        {message && <Text>{message}</Text>}

        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            {cancelLabel}
          </Button>

          <Button color={confirmColor} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ConfirmModal;
