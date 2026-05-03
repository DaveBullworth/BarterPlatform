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

export type NotifyOptions = {
  title?: ReactNode;
  message: ReactNode;
  color?: string;
  icon?: ReactNode;
  autoClose?: number | false;
  position?: NotificationPosition;
  loading?: boolean;
  loaderProps?: LoaderProps;
  radius?: MantineRadius | number;
  withCloseButton?: boolean;
  withBorder?: boolean;
  onClose?: () => void;
  closeButtonProps?: React.HTMLAttributes<HTMLButtonElement>;
};

export const notify = (options: NotifyOptions): void => {
  showNotification({
    position: 'top-center',
    withCloseButton: true,
    ...options,
  });
};
