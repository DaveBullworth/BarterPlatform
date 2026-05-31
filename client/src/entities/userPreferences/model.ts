import { z } from 'zod';

export const TAXONOMY_TARGET_TYPES = ['chapter', 'category', 'subcategory'] as const;
export type TaxonomyTargetType = (typeof TAXONOMY_TARGET_TYPES)[number];

export const PREFERENCE_WEIGHTS = [1, 2, 3] as const;
export type PreferenceWeight = (typeof PREFERENCE_WEIGHTS)[number];

export const UserPreferenceSchema = z.object({
  targetType: z.enum(TAXONOMY_TARGET_TYPES),
  targetId: z.number().int().positive(),
  weight: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export const UserPreferencesListSchema = z.object({
  items: z.array(UserPreferenceSchema),
});

export type UserPreference = z.infer<typeof UserPreferenceSchema>;
export type UserPreferencesList = z.infer<typeof UserPreferencesListSchema>;

/** Удобный лукап ключ для Map<string, weight> в UI. */
export const preferenceKey = (
  targetType: TaxonomyTargetType,
  targetId: number,
) => `${targetType}:${targetId}`;
