export const CATEGORY_PARAM = {
  CHAPTER: 'chapter',
  CATEGORY: 'category',
  SUBCATEGORY: 'subcategory',
} as const;

export type CategoryParam =
  (typeof CATEGORY_PARAM)[keyof typeof CATEGORY_PARAM];
