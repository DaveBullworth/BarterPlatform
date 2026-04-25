export const USER_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type UserTheme = (typeof USER_THEMES)[keyof typeof USER_THEMES];
