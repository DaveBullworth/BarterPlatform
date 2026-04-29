import { useState } from 'react';
import {
  Card,
  Stack,
  Text,
  TextInput,
  Button,
  Checkbox,
  Modal,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

import { TaxonomyTree } from '@/shared/ui/TaxonomyTree';
import { CategoriesSkeleton } from '@/features/category-filter/CategoriesSkeleton';
import { SubcategoryItem } from '@/features/category-filter/SubcategoryItem';
import { useTaxonomy, type Category } from '@/entities/taxonomy';

type Props = {
  value: string;
  error?: ReactNode;
  selected: {
    chapterId: number | null;
    categoryId: number | null;
    subcategoryId: number | null;
  };
  onPick: (
    chapterId: number,
    category: Category,
    subcategoryId: number | null,
  ) => void;
};

const getCategoryKey = (chapterId: number, categoryId: number) =>
  `${chapterId}:${categoryId}`;

export const TaxonomySection = ({ value, error, selected, onPick }: Props) => {
  const { t } = useTranslation();
  const { data: taxonomy = [], isLoading } = useTaxonomy();
  const [opened, setOpened] = useState(false);

  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    new Set(),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const handleOpen = () => {
    // Раскрываем до текущего выбора
    const chapters = new Set<number>();
    const categories = new Set<string>();

    if (selected.chapterId) {
      chapters.add(selected.chapterId);
      if (selected.categoryId) {
        categories.add(getCategoryKey(selected.chapterId, selected.categoryId));
      }
    }

    setExpandedChapters(chapters);
    setExpandedCategories(categories);
    setOpened(true);
  };

  const toggleChapter = (id: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCategory = (chapterId: number, categoryId: number) => {
    const key = getCategoryKey(chapterId, categoryId);
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <>
      <Card withBorder radius="md" p="md">
        <Stack>
          <Text fw={700}>{t('lotForm.taxonomy.title')}</Text>
          <TextInput
            label={t('lotForm.taxonomy.selected')}
            placeholder={t('lotForm.taxonomy.placeholder')}
            readOnly
            value={value}
            error={error}
            styles={{ input: { fontStyle: 'italic' } }}
          />
          <Button variant="default" onClick={handleOpen}>
            {t('lotForm.taxonomy.selectButton')}
          </Button>
        </Stack>
      </Card>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('lotForm.modal.selectCategory')}
        size="lg"
      >
        {isLoading ? (
          <CategoriesSkeleton />
        ) : (
          <TaxonomyTree
            taxonomy={taxonomy}
            expandedChapters={expandedChapters}
            expandedCategories={expandedCategories}
            onToggleChapter={toggleChapter}
            onToggleCategory={toggleCategory}
            isCategorySelected={(chapterId, category) =>
              selected.chapterId === chapterId &&
              selected.categoryId === category.id &&
              !selected.subcategoryId
            }
            renderCategoryRight={({
              chapterId,
              category,
              hasSubcategories,
            }) => {
              if (hasSubcategories) return null;
              return (
                <Checkbox
                  checked={
                    selected.chapterId === chapterId &&
                    selected.categoryId === category.id &&
                    !selected.subcategoryId
                  }
                  onChange={() => {
                    onPick(chapterId, category, null);
                    setOpened(false);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              );
            }}
            renderSubcategory={({ chapterId, category, subcategory }) => (
              <SubcategoryItem
                subcategory={subcategory}
                selected={selected.subcategoryId === subcategory.id}
                onSelect={() => {
                  onPick(chapterId, category, subcategory.id);
                  setOpened(false);
                }}
              />
            )}
          />
        )}
      </Modal>
    </>
  );
};
