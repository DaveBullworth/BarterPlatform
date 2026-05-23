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
          <Text fw={700} size="md">
            {title}
          </Text>
        )
      }
      centered
      size="md"
    >
      <Stack gap="md">
        {message && (
          <Text size="sm" c="dimmed">
            {message}
          </Text>
        )}
        {children}

        <Group justify="flex-end" gap="xs">
          <Button
            variant="default"
            onClick={onCancel}
            disabled={loading}
          >
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
