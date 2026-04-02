import {
  Box,
  Button,
  Center,
  Checkbox,
  Collapse,
  Drawer,
  Group,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  BriefcaseBusiness,
  Building2,
  Car,
  ChevronRight,
  CircleEllipsis,
  Cpu,
  Dumbbell,
  Hammer,
  HeartPulse,
  House,
  Laptop,
  PartyPopper,
  PawPrint,
  Shirt,
  ShirtIcon,
  Smartphone,
  Sofa,
  Trees,
  WashingMachine,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  clearCategorySelection,
  selectCategorySelection,
  setCategorySelection,
} from '@/store/categoryFilterSlice';
import {
  fetchTaxonomyIfNeeded,
  selectTaxonomy,
  selectTaxonomyLoading,
} from '@/store/taxonomySlice';
import type { CategorySelection } from '@/types/taxonomy';
import type { AppDispatch } from '@/store';
import styles from './MainLayout.module.scss';

type Props = {
  opened: boolean;
  onClose: () => void;
};

const chapterIcons: Record<string, LucideIcon> = {
  nedvizhimost: Building2,
  'auto-i-zapchasti': Car,
  'bytovaya-tehnika': WashingMachine,
  'kompyuternaya-tekhnika': Laptop,
  'telefony-i-planshety': Smartphone,
  elektronika: Cpu,
  'zhenskiy-garderob': Shirt,
  'muzhskoy-garderob': ShirtIcon,
  'beauty-health': HeartPulse,
  'kids-moms': Baby,
  furniture: Sofa,
  home: House,
  construction: Hammer,
  'garden-and-garden': Trees,
  'hobby-sports-tourism': Dumbbell,
  'weddings-holidays': PartyPopper,
  animals: PawPrint,
  'business-equipment': BriefcaseBusiness,
  other: CircleEllipsis,
};

const getCategoryKey = (chapterId: number, categoryId: number) =>
  `${chapterId}:${categoryId}`;

const isSameSelection = (
  current: CategorySelection | null,
  next: CategorySelection,
) => {
  switch (next.level) {
    case 'chapter':
      return (
        current?.level === 'chapter' && current.chapterId === next.chapterId
      );
    case 'category':
      return (
        current?.level === 'category' &&
        current.chapterId === next.chapterId &&
        current.categoryId === next.categoryId
      );
    case 'subcategory':
      return (
        current?.level === 'subcategory' &&
        current.chapterId === next.chapterId &&
        current.categoryId === next.categoryId &&
        current.subcategoryId === next.subcategoryId
      );
  }
};

export const CategoriesDrawer = ({ opened, onClose }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const selected = useSelector(selectCategorySelection);
  const data = useSelector(selectTaxonomy);
  const loading = useSelector(selectTaxonomyLoading);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    new Set(),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const initExpandedFromSelection = useCallback(() => {
    if (!selected) {
      setExpandedChapters(new Set());
      setExpandedCategories(new Set());
      return;
    }

    const chapters = new Set<number>();
    const categories = new Set<string>();

    if (selected.level === 'chapter') {
      chapters.add(selected.chapterId);
    }

    if (selected.level === 'category') {
      chapters.add(selected.chapterId);
      categories.add(getCategoryKey(selected.chapterId, selected.categoryId));
    }

    if (selected.level === 'subcategory') {
      chapters.add(selected.chapterId);
      categories.add(getCategoryKey(selected.chapterId, selected.categoryId));
    }

    setExpandedChapters(chapters);
    setExpandedCategories(categories);
  }, [selected]);

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const toggleCategory = (chapterId: number, categoryId: number) => {
    const key = getCategoryKey(chapterId, categoryId);

    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelection = (next: CategorySelection) => {
    if (isSameSelection(selected, next)) {
      dispatch(clearCategorySelection());
      return;
    }

    dispatch(setCategorySelection(next));
  };

  const handleClose = () => {
    setExpandedChapters(new Set());
    setExpandedCategories(new Set());
    onClose();
  };

  useEffect(() => {
    if (!opened) return;
    dispatch(fetchTaxonomyIfNeeded());
  }, [dispatch, opened]);

  useEffect(() => {
    if (opened) {
      // асинхронно вызываем функцию
      const timeout = setTimeout(() => {
        initExpandedFromSelection();
      }, 0);

      return () => clearTimeout(timeout); // очистка на unmount / закрытие
    }
  }, [opened, initExpandedFromSelection]);

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      position="left"
      size="lg"
      title={t('categories.title')}
      className={styles.notificationsDrawer}
    >
      <Group mb="sm" justify="space-between" px="sm">
        <Text size="sm" c="dimmed">
          {t('categories.hint')}
        </Text>
        <Button
          variant="subtle"
          size="compact-sm"
          onClick={() => dispatch(clearCategorySelection())}
        >
          {t('categories.reset')}
        </Button>
      </Group>

      {loading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : (
        <Stack gap="md">
          {data.map((chapter) => {
            const ChapterIcon = chapterIcons[chapter.slug] ?? Building2;
            const chapterExpanded = expandedChapters.has(chapter.id);
            const chapterSelected =
              selected?.level === 'chapter' &&
              selected.chapterId === chapter.id;

            return (
              <Stack
                key={chapter.id}
                // gap={6}
                gap={chapterExpanded ? 'sm' : 0}
                px="sm"
              >
                <UnstyledButton
                  onClick={() => toggleChapter(chapter.id)}
                  style={{
                    borderRadius: 10,
                    border: '1px solid var(--mantine-color-gray-3)',
                    padding: '8px 10px',
                    backgroundColor: chapterSelected
                      ? 'var(--mantine-color-blue-0)'
                      : 'var(--mantine-color-white)',
                  }}
                >
                  <Group justify="space-between" wrap="nowrap" gap="sm">
                    <Group wrap="nowrap" gap="xs">
                      <ThemeIcon variant="light" size="sm">
                        <ChapterIcon size={15} />
                      </ThemeIcon>
                      <Text size="sm" fw={600}>
                        {chapter.name}
                      </Text>
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                      <ChevronRight
                        size={16}
                        style={{
                          transform: chapterExpanded
                            ? 'rotate(90deg)'
                            : 'rotate(0deg)',
                          transition: 'transform 150ms ease',
                        }}
                      />
                      <Checkbox
                        checked={chapterSelected}
                        onChange={() =>
                          toggleSelection({
                            level: 'chapter',
                            chapterId: chapter.id,
                          })
                        }
                        onClick={(event) => event.stopPropagation()}
                        aria-label={chapter.name}
                      />
                    </Group>
                  </Group>
                </UnstyledButton>

                <Collapse in={chapterExpanded}>
                  {chapterExpanded && (
                    <Stack pl="md" gap={4}>
                      {chapter.categories.map((category) => {
                        const hasSubcategories =
                          category.subcategories.length > 0;
                        const categoryExpanded = expandedCategories.has(
                          getCategoryKey(chapter.id, category.id),
                        );
                        const categorySelected =
                          selected?.level === 'category' &&
                          selected.chapterId === chapter.id &&
                          selected.categoryId === category.id;

                        return (
                          <Stack key={category.id} gap={4}>
                            <UnstyledButton
                              onClick={() => {
                                if (!hasSubcategories) return;
                                toggleCategory(chapter.id, category.id);
                              }}
                              style={{
                                borderRadius: 8,
                                border: '1px solid var(--mantine-color-gray-2)',
                                padding: '6px 10px',
                                cursor: hasSubcategories
                                  ? 'pointer'
                                  : 'default',
                                backgroundColor: categorySelected
                                  ? 'var(--mantine-color-blue-0)'
                                  : 'var(--mantine-color-white)',
                              }}
                            >
                              <Group justify="space-between" wrap="nowrap">
                                <Text size="sm">{category.name}</Text>
                                <Group gap="xs" wrap="nowrap">
                                  {hasSubcategories ? (
                                    <ChevronRight
                                      size={14}
                                      style={{
                                        transform: categoryExpanded
                                          ? 'rotate(90deg)'
                                          : 'rotate(0deg)',
                                        transition: 'transform 150ms ease',
                                      }}
                                    />
                                  ) : (
                                    <Box w={14} />
                                  )}
                                  <Checkbox
                                    checked={categorySelected}
                                    onChange={() =>
                                      toggleSelection({
                                        level: 'category',
                                        chapterId: chapter.id,
                                        categoryId: category.id,
                                      })
                                    }
                                    onClick={(event) => event.stopPropagation()}
                                    aria-label={category.name}
                                  />
                                </Group>
                              </Group>
                            </UnstyledButton>

                            {hasSubcategories && categoryExpanded && (
                              <Collapse in={categoryExpanded}>
                                <Stack pl="md" gap={4}>
                                  {category.subcategories.map((subcategory) => {
                                    const subcategorySelected =
                                      selected?.level === 'subcategory' &&
                                      selected.chapterId === chapter.id &&
                                      selected.categoryId === category.id &&
                                      selected.subcategoryId === subcategory.id;

                                    return (
                                      <Group
                                        key={subcategory.id}
                                        justify="space-between"
                                        wrap="nowrap"
                                        style={{
                                          borderRadius: 8,
                                          border:
                                            '1px solid var(--mantine-color-gray-2)',
                                          padding: '4px 10px',
                                          backgroundColor: subcategorySelected
                                            ? 'var(--mantine-color-blue-0)'
                                            : 'var(--mantine-color-white)',
                                        }}
                                      >
                                        <Text size="sm">
                                          {subcategory.name}
                                        </Text>
                                        <Checkbox
                                          checked={subcategorySelected}
                                          onChange={() =>
                                            toggleSelection({
                                              level: 'subcategory',
                                              chapterId: chapter.id,
                                              categoryId: category.id,
                                              subcategoryId: subcategory.id,
                                            })
                                          }
                                          aria-label={subcategory.name}
                                        />
                                      </Group>
                                    );
                                  })}
                                </Stack>
                              </Collapse>
                            )}
                          </Stack>
                        );
                      })}
                    </Stack>
                  )}
                </Collapse>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Drawer>
  );
};
