export type ChapterSeed = {
  externalId: number;
  name: string;
  slug: string;
};

export type CategorySeed = {
  externalId: number;
  chapterId: number;
  name: string;
  slug: string;
};

export type SubcategorySeed = {
  externalId: number;
  categoryId: number;
  name: string;
  slug: string;
};
