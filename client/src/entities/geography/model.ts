import { z } from 'zod';

// Zod схемы — валидация + типы одним махом
export const GeoNodeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const RegionSchema = GeoNodeSchema;

export const CitySchema = GeoNodeSchema.extend({
  regionId: z.number().int().positive(),
});

export const DistrictSchema = GeoNodeSchema.extend({
  cityId: z.number().int().positive(),
});

// Типы выводятся из схем
export type GeoNode = z.infer<typeof GeoNodeSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type City = z.infer<typeof CitySchema>;
export type District = z.infer<typeof DistrictSchema>;

// SelectOption — UI примитив нужный везде где есть Select
// Живёт здесь потому что география — единственный его потребитель на entity уровне
// Если бы использовался шире — ушёл бы в shared/ui
export type GeoSelectOption = {
  value: string;
  label: string;
};

export type GeoValue = {
  regionId: string;
  cityId: string;
  districtId: string;
};
