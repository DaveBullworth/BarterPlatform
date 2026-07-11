import { createElement } from 'react';
import type { AxiosError } from 'axios';
import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import {
  AlertCircle,
  ClockAlert,
  DoorClosedLocked,
  UserRoundX,
  UserRoundMinus,
  ImageOff,
  Crown,
} from 'lucide-react';
import { notify } from '@/shared/lib';
import { ERROR_TYPES, type ErrorTypes } from '@/shared/constants/error-types';

export interface ApiErrorData {
  code?: ErrorTypes;
  message?: string;
  meta?: {
    // auth
    maxSessions?: number;
    currentSessions?: number;
    action?: string;
    isBruteforce?: boolean; // новый флаг

    // mail confirm / resend
    loginOrEmail?: string;
    waitHours?: number;

    // offers
    waitMinutes?: number;
  };
}

interface ApiErrorOptions {
  defaultMessage?: string | ReactNode; // если неизвестная ошибка
  renderEmailNotConfirmed?: (loginOrEmail: string) => ReactNode; // вместо прямого импорта компонента — колбэк
}

export const handleApiError = (
  error: unknown,
  t: TFunction,
  opts?: ApiErrorOptions,
) => {
  if (!error) return;

  const title = t('common.error');
  let message: ReactNode = opts?.defaultMessage || 'Something went wrong';
  let color: 'blue' | 'red' | 'green' | 'yellow' | 'teal' | 'gray' = 'red';
  let icon: ReactNode = undefined;
  let loading = false;
  let autoClose: number | undefined = 5000;

  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError;

    if (axiosError.response?.data) {
      const data = axiosError.response.data as ApiErrorData;

      // Специально для `EMAIL_NOT_CONFIRMED`
      const loginOrEmail = data.meta?.loginOrEmail;

      switch (data.code) {
        /** AUTH */
        case ERROR_TYPES.INVALID_CREDENTIALS:
          message = t('auth.invalidCredentials');
          color = 'yellow';
          break;
        case ERROR_TYPES.EMAIL_NOT_CONFIRMED:
          if (loginOrEmail && opts?.renderEmailNotConfirmed) {
            message = opts.renderEmailNotConfirmed(loginOrEmail);
            autoClose = undefined;
          } else {
            message = t('auth.emailNotConfirmed');
          }
          color = 'yellow';
          break;
        case ERROR_TYPES.MAX_SESSIONS_EXCEEDED:
          message = t('auth.maxSessionsExceeded', {
            max: data.meta?.maxSessions ?? '?',
          });
          color = 'yellow';
          break;
        case ERROR_TYPES.LOGIN_RATE_LIMIT:
        case ERROR_TYPES.TOO_MANY_REQUESTS:
          if (data.meta?.isBruteforce) {
            // Красное уведомление, долгий таймер
            message = t('auth.loginBruteforce');
            color = 'red';
            icon = createElement(AlertCircle, { size: 18 });
          } else {
            // Обычный rate-limit, короткий таймер (жёлтый)
            message = t('auth.loginRateLimit');
            color = 'yellow';
            loading = true;
          }
          break;

        /** REGISTRATION */
        case ERROR_TYPES.EMAIL_ALREADY_IN_USE:
          message = t('auth.emailAlreadyInUse');
          color = 'yellow';
          break;

        case ERROR_TYPES.LOGIN_ALREADY_IN_USE:
          message = t('auth.loginAlreadyInUse');
          color = 'yellow';
          break;

        case ERROR_TYPES.COUNTRY_NOT_FOUND:
          message = t('auth.countryNotFound');
          color = 'yellow';
          break;

        /** MAIL-RESEND */
        case ERROR_TYPES.EMAIL_ALREADY_CONFIRMED:
          message = t('auth.emailAlreadyConfirmed');
          color = 'yellow';
          break;

        case ERROR_TYPES.RESEND_CONFIRM_RATE_LIMIT:
          message = t('auth.resendRateLimit', {
            hours: data.meta?.waitHours?.toFixed(1),
          });
          color = 'yellow';
          break;

        case ERROR_TYPES.USER_NOT_FOUND:
          message = t('auth.userNotFound');
          color = 'red';
          icon = createElement(UserRoundMinus, { size: 18 });
          break;

        /** PASSWORD-RESET */
        case ERROR_TYPES.PASSWORD_RESET_RATE_LIMIT:
          message = t('auth.passwordResetRateLimit');
          color = 'yellow';
          icon = createElement(ClockAlert, { size: 18 });
          break;

        /** LOGOUT */
        case ERROR_TYPES.REFRESH_TOKEN_MISSING:
          message = t('common.refreshTokenNotFound');
          color = 'red';
          icon = createElement(DoorClosedLocked, { size: 18 });
          break;

        case ERROR_TYPES.SESSION_NOT_FOUND:
          message = t('common.sessionNotFound');
          color = 'red';
          icon = createElement(DoorClosedLocked, { size: 18 });
          break;

        /** GET SELF USER */
        case ERROR_TYPES.USER_DEACTIVATED:
          message = t('common.userDeactivated');
          color = 'red';
          icon = createElement(UserRoundX, { size: 18 });
          break;

        /** AVATAR */
        case ERROR_TYPES.AVATAR_INVALID_FORMAT:
          message = t('profile.avatarInvalidFormat'); // например "Можно загружать только PNG и JPG"
          color = 'red';
          icon = createElement(ImageOff, { size: 18 });
          break;

        case ERROR_TYPES.AVATAR_PROCESSING_ERROR:
          message = t('profile.avatarProcessingError'); // "Ошибка обработки изображения"
          color = 'red';
          icon = createElement(ImageOff, { size: 18 });
          break;

        case ERROR_TYPES.AVATAR_NOT_FOUND:
          message = t('profile.avatarNotFound'); // "Аватар не найден"
          color = 'yellow';
          icon = createElement(ImageOff, { size: 18 });
          break;

        /** UPDATE USER */
        case ERROR_TYPES.LAST_ADMIN_DEACTIVATION_FORBIDDEN:
          message = t('profile.lastAdminDeactivation'); // "Аватар не найден"
          color = 'yellow';
          icon = createElement(Crown, { size: 18 });
          break;

        /** GEO */
        case ERROR_TYPES.REGION_NOT_FOUND:
          message = t('auth.regionNotFound');
          color = 'yellow';
          break;

        case ERROR_TYPES.CITY_NOT_FOUND:
          message = t('auth.cityNotFound');
          color = 'yellow';
          break;

        case ERROR_TYPES.DISTRICT_NOT_FOUND:
          message = t('auth.districtNotFound');
          color = 'yellow';
          break;

        /** TAXONOMY */
        case ERROR_TYPES.CHAPTER_NOT_FOUND:
          message = t('auth.chapterNotFound');
          color = 'yellow';
          break;

        case ERROR_TYPES.CATEGORY_NOT_FOUND:
          message = t('auth.categoryNotFound');
          color = 'yellow';
          break;

        case ERROR_TYPES.SUBCATEGORY_REQUIRED:
          message = t('auth.subcategoryRequired');
          color = 'yellow';
          break;

        case ERROR_TYPES.SUBCATEGORY_NOT_FOUND:
          message = t('auth.subcategoryNotFound');
          color = 'yellow';
          break;

        /** LOT */
        case ERROR_TYPES.LOT_NOT_FOND:
          message = t('lot.notFound');
          color = 'yellow';
          break;

        case ERROR_TYPES.NO_ACCESS:
          message = t('common.noAccess');
          color = 'red';
          icon = createElement(DoorClosedLocked, { size: 18 });
          break;

        case ERROR_TYPES.NOT_OWNER:
          message = t('lot.notOwner');
          color = 'red';
          icon = createElement(DoorClosedLocked, { size: 18 });
          break;

        case ERROR_TYPES.USER_ARCHIVED:
          message = t('lot.userArchived');
          color = 'red';
          icon = createElement(UserRoundX, { size: 18 });
          break;

        /** OFFERS */
        case ERROR_TYPES.DUPLICATE_OFFER:
          message = t('offers.errors.duplicateOffer');
          color = 'yellow';
          break;

        case ERROR_TYPES.MIRROR_OFFER_EXISTS:
          message = t('offers.errors.mirrorOffer');
          color = 'yellow';
          break;

        case ERROR_TYPES.OFFERED_LOT_NOT_PREFERRED:
          message = t('offers.errors.notPreferred');
          color = 'yellow';
          break;

        case ERROR_TYPES.OFFER_COOLDOWN:
          message = t('offers.errors.cooldown', {
            minutes: data.meta?.waitMinutes ?? 60,
          });
          color = 'yellow';
          icon = createElement(ClockAlert, { size: 18 });
          break;

        /** CHAT — вложения */
        case ERROR_TYPES.CHAT_FILE_WRONG_TYPE:
          message = t('chat.errors.wrongType');
          color = 'red';
          icon = createElement(ImageOff, { size: 18 });
          break;

        case ERROR_TYPES.CHAT_FILE_TOO_LARGE:
          message = t('chat.errors.tooLargeGeneric');
          color = 'yellow';
          break;

        case ERROR_TYPES.CHAT_FILE_INFECTED:
          message = t('chat.errors.infected');
          color = 'red';
          icon = createElement(AlertCircle, { size: 18 });
          break;

        case ERROR_TYPES.CHAT_FILE_SCAN_FAILED:
          message = t('chat.errors.scanUnavailable');
          color = 'yellow';
          icon = createElement(ClockAlert, { size: 18 });
          break;

        default:
          message = data.message || message;
          color = 'red';
          icon = createElement(AlertCircle, { size: 18 });
          break;
      }
    } else {
      message = t('auth.serverError');
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  notify({
    title,
    message,
    color,
    icon,
    loading,
    autoClose,
  });
};
