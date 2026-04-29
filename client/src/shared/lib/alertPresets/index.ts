import { ALERT_PRESETS } from '@/shared/constants/alert-presets';
import type { ReactNode } from 'react';
import type { MantineColor } from '@mantine/core';

export type AlertVariantType = 'success' | 'error' | 'warning' | 'info';

export interface AlertPreset {
  color: MantineColor;
  icon: ReactNode;
}

export const buildAlertProps = (type: AlertVariantType, message: ReactNode) => {
  const preset = ALERT_PRESETS[type];

  return {
    color: preset.color,
    icon: preset.icon,
    title: message,
    withCloseButton: true,
  };
};
