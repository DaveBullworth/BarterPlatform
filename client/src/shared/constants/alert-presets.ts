import React from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import type { AlertPreset, AlertVariantType } from '../lib';

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
