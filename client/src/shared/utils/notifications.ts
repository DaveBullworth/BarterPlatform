import { showNotification } from '@mantine/notifications';
import type { ReactNode } from 'react';
import type { LoaderProps, MantineRadius } from '@mantine/core';

export type NotificationPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface NotifyOptions {
  title?: ReactNode;
  message: ReactNode;
  color?: string; // любой CSS цвет или ключ из theme.colors
  icon?: ReactNode;
  autoClose?: number;
  position?: NotificationPosition;
  loading?: boolean;
  loaderProps?: LoaderProps;
  radius?: MantineRadius | number;
  withCloseButton?: boolean;
  withBorder?: boolean;
  onClose?: () => void;
  closeButtonProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export const notify = ({
  title,
  message,
  color,
  icon,
  autoClose,
  position = 'top-center',
  loading,
  loaderProps,
  radius,
  withCloseButton = true,
  withBorder,
  onClose,
  closeButtonProps,
}: NotifyOptions) => {
  showNotification({
    title,
    message,
    color,
    icon,
    autoClose,
    position,
    loading,
    loaderProps,
    radius,
    withCloseButton,
    withBorder,
    onClose,
    closeButtonProps,
  });
};
