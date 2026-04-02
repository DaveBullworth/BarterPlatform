import { $host } from './index';
import type { TaxonomyChapter } from '@/types/taxonomy';

export const getTaxonomy = async () => {
  const { data } = await $host.get<TaxonomyChapter[]>('/lot/taxonomy');
  return data;
};
