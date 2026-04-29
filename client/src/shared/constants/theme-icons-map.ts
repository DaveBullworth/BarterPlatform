import { createElement } from 'react';
import { Sun, Moon, MonitorCog } from 'lucide-react';
import type { ReactNode } from 'react';

import { USER_THEMES, type UserTheme } from './user-theme';

export const THEME_ICON_MAP: Record<UserTheme, ReactNode> = {
  [USER_THEMES.LIGHT]: createElement(Sun, { size: 18 }),
  [USER_THEMES.DARK]: createElement(Moon, { size: 18 }),
  [USER_THEMES.SYSTEM]: createElement(MonitorCog, { size: 18 }),
};
