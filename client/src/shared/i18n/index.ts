import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';
import { USER_LANGUAGES, type UserLanguage } from '../constants/user-language';

const STORAGE_KEY = 'user-language';

const isUserLanguage = (value: string | null): value is UserLanguage =>
  value !== null &&
  Object.values(USER_LANGUAGES).includes(value as UserLanguage);

const rawLanguage = localStorage.getItem(STORAGE_KEY);

const storedLanguage: UserLanguage = isUserLanguage(rawLanguage)
  ? rawLanguage
  : USER_LANGUAGES.EN;

i18n.use(initReactI18next).init({
  resources,
  lng: storedLanguage,
  fallbackLng: USER_LANGUAGES.EN,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
