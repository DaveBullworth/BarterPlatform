import type { ComponentType } from 'react';
import { SearchX, ShieldOff, Timer, ServerCrash } from 'lucide-react';

type IconType = ComponentType<{ size?: number }>;

export const CONFIG_BY_STATUS: Record<
  number,
  { icon: IconType; titleKey: string; descKey: string }
> = {
  404: {
    icon: SearchX,
    titleKey: 'error.notFound.title',
    descKey: 'error.notFound.description',
  },
  403: {
    icon: ShieldOff,
    titleKey: 'error.forbidden.title',
    descKey: 'error.forbidden.description',
  },
  429: {
    icon: Timer,
    titleKey: 'error.tooManyRequests.title',
    descKey: 'error.tooManyRequests.description',
  },
};

export const DEFAULT_CONFIG = {
  icon: ServerCrash,
  titleKey: 'common.error',
  descKey: 'common.errorDescription',
};
