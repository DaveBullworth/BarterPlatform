import { z } from 'zod';

// Базовые переиспользуемые схемы
export const loginSchema = z.string().min(8).max(60);
export const passwordSchema = z.string().min(8).max(60);
export const emailSchema = z.string().email().min(8).max(200);
export const nameSchema = z.string().min(5).max(200);
export const phoneSchema = z
  .string()
  .regex(/^\d{7,11}$/)
  .optional()
  .or(z.literal(''));

// Фабрика для Mantine форм
// Mantine useForm ожидает (value) => string | null
// Zod даёт нам схему — адаптер соединяет их

export const zodToMantine =
  <T>(schema: z.ZodType<T>, errorMessage: string) =>
  (value: unknown): string | null => {
    const result = schema.safeParse(value);
    return result.success ? null : errorMessage;
  };

// Готовые валидаторы для Mantine форм
// t передаётся снаружи — валидатор не знает о языке

type MantineValidator = (value: unknown) => string | null;

export const createMantineValidators = (
  t: (key: string, opts?: Record<string, unknown>) => string,
) => ({
  login: zodToMantine(
    loginSchema,
    t('validation.minLength', { field: t('auth.login'), min: 8 }),
  ),
  password: zodToMantine(
    passwordSchema,
    t('validation.minLength', { field: t('auth.password'), min: 8 }),
  ),
  email: zodToMantine(emailSchema, t('validation.invalidEmail')),
  name: zodToMantine(
    nameSchema,
    t('validation.minLength', { field: t('auth.name'), min: 5 }),
  ),
  phone: (value: unknown): string | null => {
    if (!value || value === '') return null;
    return zodToMantine(
      z.string().regex(/^\d{7,11}$/),
      t('validation.phone'),
    )(value);
  },
  required:
    (fieldKey: string): MantineValidator =>
    (value) =>
      value ? null : t('validation.required', { field: t(fieldKey) }),
});
