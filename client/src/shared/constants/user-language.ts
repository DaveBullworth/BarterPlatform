export const USER_LANGUAGES = {
  EN: 'en',
  PL: 'pl',
  RU: 'ru',
  DE: 'de',
} as const;

export type UserLanguage = (typeof USER_LANGUAGES)[keyof typeof USER_LANGUAGES];
