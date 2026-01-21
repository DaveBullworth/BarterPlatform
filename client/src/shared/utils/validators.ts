import type { TFunction } from 'i18next';

type LengthOptions = {
  min?: number;
  max?: number;
};

export const createLengthValidator =
  (t: TFunction, fieldKey: string, { min, max }: LengthOptions) =>
  (value: string) => {
    if (min !== undefined && value.length < min) {
      return t('validation.minLength', {
        field: t(fieldKey),
        min,
      });
    }

    if (max !== undefined && value.length > max) {
      return t('validation.maxLength', {
        field: t(fieldKey),
        max,
      });
    }

    return null;
  };

export const createEmailValidator = (t: TFunction) => (value: string) =>
  /^\S+@\S+$/.test(value) ? null : t('validation.invalidEmail');

export const required = (t: TFunction, fieldKey: string) => (value: unknown) =>
  value ? null : t('validation.required', { field: t(fieldKey) });

export const phoneValidator = (t: TFunction) => (value?: string) => {
  if (!value) return null;

  return createLengthValidator(t, 'auth.phone', {
    min: 7,
    max: 11,
  })(value);
};
