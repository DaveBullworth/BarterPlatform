import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

type ConfirmModalProps = {
  opened: boolean;
  onConfirm: () => void;
  onCancel: () => void;

  title?: ReactNode;
  message?: ReactNode;

  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;

  loading?: boolean;
  // для случаев когда нужен кастомный контент вместо message
  children?: ReactNode;
};

export const ConfirmModal = ({
  opened,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'red',
  loading = false,
  children,
}: ConfirmModalProps) => {
  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title={
        title && (
          <Text fw={700} size="lg" td="underline">
            {title}
          </Text>
        )
      }
      centered
    >
      <Stack>
        {message && <Text>{message}</Text>}
        {children}

        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel} disabled={loading}>
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
