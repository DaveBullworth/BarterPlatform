import { z } from 'zod';
import { USER_ROLES } from '@/shared/constants/user-role';
import { USER_THEMES } from '@/shared/constants/user-theme';
import { USER_LANGUAGES } from '@/shared/constants/user-language';
import { enumFromObject } from '@/shared/utils/enum-from-obj.helper';
import type {
  TextFilter,
  BooleanFilter,
  MultiTextFilter,
  DateRangeFilter,
} from '@/shared/lib/filters';

const GeoNodeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

// Базовые поля есть у всех трёх типов
const BaseUserSchema = z.object({
  id: z.uuid(),
  login: z.string().min(1),
  name: z.string().min(1),
  region: GeoNodeSchema.nullable(),
  city: GeoNodeSchema.nullable(),
  district: GeoNodeSchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// Публичный — минимум данных
export const PublicUserSchema = BaseUserSchema;

// Self — добавляет приватные поля + настройки
export const SelfUserSchema = BaseUserSchema.extend({
  role: enumFromObject(USER_ROLES),
  email: z.email(),
  phone: z.string().nullable(),
  language: enumFromObject(USER_LANGUAGES),
  theme: enumFromObject(USER_THEMES),
});

// Admin view — всё кроме настроек
export const AdminUserSchema = BaseUserSchema.extend({
  role: enumFromObject(USER_ROLES),
  email: z.email(),
  phone: z.string().nullable(),
  status: z.boolean(),
  statusEmail: z.boolean(),
});

// Типы
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type SelfUser = z.infer<typeof SelfUserSchema>;
export type AdminUser = z.infer<typeof AdminUserSchema>;
export type AnyUser = SelfUser | AdminUser | PublicUser;

// DTO для обновления
export const UpdateSelfUserSchema = z.object({
  login: z.string().min(8).max(60).optional(),
  name: z.string().min(5).max(200).optional(),
  phone: z.string().nullable().optional(),
  regionId: z.number().int().positive().optional(),
  cityId: z.number().int().positive().optional(),
  districtId: z.number().int().positive().nullable().optional(),
  language: enumFromObject(USER_LANGUAGES).optional(),
  theme: enumFromObject(USER_THEMES).optional(),
});

export const UpdateAdminUserSchema = UpdateSelfUserSchema.extend({
  email: z.email().optional(),
  password: z.string().min(8).max(60).optional(),
  role: enumFromObject(USER_ROLES).optional(),
  status: z.boolean().optional(),
  statusEmail: z.boolean().optional(),
});

export type UpdateSelfUserDto = z.infer<typeof UpdateSelfUserSchema>;
export type UpdateAdminUserDto = z.infer<typeof UpdateAdminUserSchema>;

export type UserFilters = {
  login?: TextFilter;
  name?: TextFilter;
  email?: TextFilter;
  phone?: TextFilter;
  role?: BooleanFilter;
  status?: BooleanFilter;
  region?: MultiTextFilter;
  city?: MultiTextFilter;
  district?: MultiTextFilter;
  createdAt?: DateRangeFilter;
};
