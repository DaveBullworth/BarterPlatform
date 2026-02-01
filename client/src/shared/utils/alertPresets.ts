import React from 'react';
import type { ReactNode } from 'react';
import type { MantineColor } from '@mantine/core';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

export type AlertVariantType = 'success' | 'error' | 'warning' | 'info';

export interface AlertPreset {
  color: MantineColor;
  icon: ReactNode;
}

export const ALERT_PRESETS: Record<AlertVariantType, AlertPreset> = {
  success: {
    color: 'green',
    icon: React.createElement(CheckCircle, { size: 18 }),
  },
  error: {
    color: 'red',
    icon: React.createElement(XCircle, { size: 18 }),
  },
  warning: {
    color: 'yellow',
    icon: React.createElement(AlertTriangle, { size: 18 }),
  },
  info: {
    color: 'blue',
    icon: React.createElement(Info, { size: 18 }),
  },
};

export const buildAlertProps = (type: AlertVariantType, message: ReactNode) => {
  const preset = ALERT_PRESETS[type];

  return {
    color: preset.color,
    icon: preset.icon,
    title: message,
    withCloseButton: true,
  };
};
