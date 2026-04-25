import { useQuery } from '@tanstack/react-query';
import { $host } from '@/shared/api';
import { TaxonomySchema, type Taxonomy } from './model';

export const taxonomyKeys = {
  all: () => ['taxonomy'] as const,
};

const fetchTaxonomy = async (): Promise<Taxonomy> => {
  const { data } = await $host.get('/lot/taxonomy');
  return TaxonomySchema.parse(data);
};

export const useTaxonomy = () => {
  return useQuery({
    queryKey: taxonomyKeys.all(),
    queryFn: fetchTaxonomy,
    staleTime: Infinity, // taxonomy не меняется — один запрос на всё время сессии
    gcTime: Infinity, // не удаляем из кеша никогда
  });
};

// Производный хук — когда нужна только конкретная глава
export const useChapter = (chapterId: number | null) => {
  const { data: taxonomy = [] } = useTaxonomy();
  return taxonomy.find((c) => c.id === chapterId) ?? null;
};
