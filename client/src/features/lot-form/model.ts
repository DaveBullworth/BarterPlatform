import { z } from 'zod';

export const LotFormSchema = z.object({
  taxonomyPath: z.string().min(1, 'lotForm.validation.taxonomyRequired'),
  chapterId: z.number().int().positive().nullable(),
  categoryId: z.number().int().positive().nullable(),
  subcategoryId: z.number().int().positive().nullable(),
  generalDescription: z.string().min(1).max(255),
  characteristicsDescription: z.string().min(1).max(1000),
  quantity: z.number().int().min(1).max(10000),
  regionId: z.string().min(1),
  cityId: z.string().min(1),
  districtId: z.string(),
  visibilityStatus: z.boolean(),
  archivationDate: z.string().nullable().optional(),
});

export type LotFormValues = z.infer<typeof LotFormSchema>;

export const EMPTY_LOT_FORM: LotFormValues = {
  taxonomyPath: '',
  chapterId: null,
  categoryId: null,
  subcategoryId: null,
  generalDescription: '',
  characteristicsDescription: '',
  quantity: 1,
  regionId: '',
  cityId: '',
  districtId: '',
  visibilityStatus: true,
  archivationDate: null,
};

export const MAX_LOT_IMAGES = 3;
