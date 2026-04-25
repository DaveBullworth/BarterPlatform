import { z } from 'zod';
import { LOT_STATUS } from '@/shared/constants/lot-status';
import { enumFromObject } from '@/shared/utils/enum-from-obj.helper';
import type { TextFilter, IDFilter } from '@/shared/lib/filters';

const GeoNodeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

// Базовый лот — поля общие для всех представлений
const BaseLotSchema = z.object({
  id: z.uuid(),
  chapterId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  subcategoryId: z.number().int().positive().nullable(),
  generalDescription: z.string().min(1).max(255),
  characteristicsDescription: z.string().min(1).max(1000),
  quantity: z.number().int().min(1).max(10000),
  visibilityStatus: enumFromObject(LOT_STATUS),
  region: GeoNodeSchema,
  city: GeoNodeSchema,
  district: GeoNodeSchema.nullable(),
  archivationDate: z.iso.datetime().nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// Полный лот (владелец/админ видят userId)
export const LotSchema = BaseLotSchema.extend({
  userId: z.uuid(),
});

// Публичное представление лота (в ленте — без userId)
export const LotResponseSchema = BaseLotSchema;

// Пагинированный ответ
export const PaginatedLotsSchema = z.object({
  total: z.number().int().nonnegative(),
  data: z.array(LotResponseSchema),
});

// Изображение лота
export const LotImageSchema = z.object({
  imageId: z.uuid(),
  isPrimary: z.boolean(),
  mimeType: z.string().min(1),
  data: z.string().min(1), // base64
});

export const LotImagesResponseSchema = z.object({
  lotId: z.uuid(),
  images: z.array(LotImageSchema),
});

// Главное изображение лота (для ленты)
export const LotMainImageSchema = z.object({
  lotId: z.uuid(),
  imageId: z.uuid().nullable(),
  mimeType: z.string().nullable(),
  data: z.string().nullable(),
});

export const LotsMainImagesResponseSchema = z.object({
  items: z.array(LotMainImageSchema),
});

// DTO создания/обновления
export const CreateLotSchema = z.object({
  chapterId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  subcategoryId: z.number().int().positive().optional(),
  generalDescription: z.string().min(1).max(255),
  characteristicsDescription: z.string().min(1).max(1000),
  quantity: z.number().int().min(1).max(10000),
  visibilityStatus: enumFromObject(LOT_STATUS),
  regionId: z.number().int().positive(),
  cityId: z.number().int().positive(),
  districtId: z.number().int().positive().nullable().optional(),
});

export const UpdateLotSchema = CreateLotSchema.partial().extend({
  visibilityStatus: enumFromObject(LOT_STATUS).optional(),
});

// Параметры запроса ленты
export const GetLotsParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  filters: z.string().optional(),
});

// Типы
export type Lot = z.infer<typeof LotSchema>;
export type LotResponse = z.infer<typeof LotResponseSchema>;
export type LotImage = z.infer<typeof LotImageSchema>;
export type LotMainImage = z.infer<typeof LotMainImageSchema>;
export type CreateLotDto = z.infer<typeof CreateLotSchema>;
export type UpdateLotDto = z.infer<typeof UpdateLotSchema>;
export type GetLotsParams = z.infer<typeof GetLotsParamsSchema>;
export type PaginatedLots = z.infer<typeof PaginatedLotsSchema>;

// Специфичные поля лота по которым можно фильтровать
export type LotFilters = {
  regionId?: IDFilter;
  cityId?: IDFilter;
  districtId?: IDFilter;
  chapterId?: IDFilter;
  categoryId?: IDFilter;
  subcategoryId?: IDFilter;
  query?: TextFilter;
};
