export type TaxonomySubcategory = {
  id: number;
  name: string;
  slug: string;
};

export type TaxonomyCategory = {
  id: number;
  name: string;
  slug: string;
  subcategories: TaxonomySubcategory[];
};

export type TaxonomyChapter = {
  id: number;
  name: string;
  slug: string;
  categories: TaxonomyCategory[];
};

export type CategorySelection =
  | {
      level: 'chapter';
      chapterId: number;
      categoryId?: undefined;
      subcategoryId?: undefined;
    }
  | {
      level: 'category';
      chapterId: number;
      categoryId: number;
      subcategoryId?: undefined;
    }
  | {
      level: 'subcategory';
      chapterId: number;
      categoryId: number;
      subcategoryId: number;
    };
