import { USER_THEMES } from './user-theme';

export const THEME_MAP: Record<string, 'light' | 'dark' | 'auto'> = {
  [USER_THEMES.LIGHT]: 'light',
  [USER_THEMES.DARK]: 'dark',
  [USER_THEMES.SYSTEM]: 'auto',
};
