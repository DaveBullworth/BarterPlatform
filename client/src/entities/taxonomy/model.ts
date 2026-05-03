import { z } from 'zod';

// Схемы — от листа к корню
export const SubcategorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const CategorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
  subcategories: z.array(SubcategorySchema),
});

export const ChapterSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
  categories: z.array(CategorySchema),
});

export const TaxonomySchema = z.array(ChapterSchema);

// Типы
export type Subcategory = z.infer<typeof SubcategorySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Taxonomy = z.infer<typeof TaxonomySchema>;

// CategorySelection — доменная концепция выбора уровня фильтра
// Дискриминированный union — TypeScript сужает тип по полю level
export type CategorySelection =
  | { level: 'chapter'; chapterId: number }
  | { level: 'category'; chapterId: number; categoryId: number }
  | {
      level: 'subcategory';
      chapterId: number;
      categoryId: number;
      subcategoryId: number;
    };
