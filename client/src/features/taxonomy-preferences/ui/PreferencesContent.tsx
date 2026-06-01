import { useMemo, useState } from 'react';
import { Button, Group, Loader, Text } from '@mantine/core';
import { CheckCheck, RotateCcw, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TaxonomyTree, useTaxonomy } from '@/entities/taxonomy';
import {
  preferenceKey,
  useReplaceUserPreferences,
  type PreferenceWeight,
  type TaxonomyTargetType,
  type UserPreference,
} from '@/entities/userPreferences';
import { handleApiError } from '@/shared/lib/errorHandler';
import { notify } from '@/shared/lib/notify';

import { LevelSelector } from './LevelSelector';
import { PreferencesHelpTooltip } from './PreferencesHelpTooltip';
import { SubcategoryLevelRow } from './SubcategoryLevelRow';
import styles from './TaxonomyPreferencesModal.module.scss';

type Props = {
  initialItems: UserPreference[];
  onClose: () => void;
};

type DraftMap = Map<string, PreferenceWeight>;

const buildDraft = (items: UserPreference[]): DraftMap => {
  const map = new Map<string, PreferenceWeight>();
  for (const item of items) {
    map.set(preferenceKey(item.targetType, item.targetId), item.weight);
  }
  return map;
};

const toggleSet = <T,>(set: Set<T>, item: T): Set<T> => {
  const next = new Set(set);
  if (next.has(item)) next.delete(item);
  else next.add(item);
  return next;
};

const categoryKey = (chapterId: number, categoryId: number) =>
  `${chapterId}:${categoryId}`;

export const PreferencesContent = ({ initialItems, onClose }: Props) => {
  const { t } = useTranslation();
  const { data: taxonomy = [], isLoading: taxonomyLoading } = useTaxonomy();
  const replaceMutation = useReplaceUserPreferences();

  const initialDraft = useMemo(() => buildDraft(initialItems), [initialItems]);

  const [draft, setDraft] = useState<DraftMap>(() => buildDraft(initialItems));
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    () => new Set(),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(),
  );

  const isDirty = useMemo(() => {
    if (initialDraft.size !== draft.size) return true;
    for (const [key, weight] of draft) {
      if (initialDraft.get(key) !== weight) return true;
    }
    return false;
  }, [draft, initialDraft]);

  const getLevel = (
    targetType: TaxonomyTargetType,
    targetId: number,
  ): PreferenceWeight | null => {
    return draft.get(preferenceKey(targetType, targetId)) ?? null;
  };

  const setLevel = (
    targetType: TaxonomyTargetType,
    targetId: number,
    weight: PreferenceWeight | null,
  ) => {
    setDraft((prev) => {
      const next = new Map(prev);
      const key = preferenceKey(targetType, targetId);
      if (weight === null) next.delete(key);
      else next.set(key, weight);
      return next;
    });
  };

  const toggleChapter = (chapterId: number) =>
    setExpandedChapters((prev) => toggleSet(prev, chapterId));

  const toggleCategory = (chapterId: number, categoryId: number) =>
    setExpandedCategories((prev) =>
      toggleSet(prev, categoryKey(chapterId, categoryId)),
    );

  const handleSave = () => {
    const items: UserPreference[] = Array.from(draft.entries()).map(
      ([key, weight]) => {
        const [targetType, targetIdStr] = key.split(':');
        return {
          targetType: targetType as TaxonomyTargetType,
          targetId: Number(targetIdStr),
          weight,
        };
      },
    );

    replaceMutation.mutate(items, {
      onSuccess: () => {
        notify({
          title: t('preferences.notify.savedTitle'),
          message: t('preferences.notify.savedMessage'),
          color: 'green',
        });
        onClose();
      },
      onError: (e) => handleApiError(e, t),
    });
  };

  const handleReset = () => {
    setDraft(new Map());
  };

  const handleSelectAll = () => {
    const next: DraftMap = new Map();
    for (const chapter of taxonomy) {
      next.set(preferenceKey('chapter', chapter.id), 1);
      for (const category of chapter.categories) {
        next.set(preferenceKey('category', category.id), 1);
        for (const sub of category.subcategories) {
          next.set(preferenceKey('subcategory', sub.id), 1);
        }
      }
    }
    setDraft(next);
  };

  return (
    <div className={styles.contentRoot}>
      <Group
        justify="space-between"
        align="center"
        wrap="nowrap"
        className={styles.headerRow}
      >
        <Text size="sm" c="dimmed">
          {t('preferences.modal.subtitle')}
        </Text>
        <PreferencesHelpTooltip />
      </Group>

      {taxonomyLoading ? (
        <div className={styles.loaderBox}>
          <Loader size="sm" color="barter" />
        </div>
      ) : (
        <div className={styles.treeWrapper}>
          <TaxonomyTree
            taxonomy={taxonomy}
            expandedChapters={expandedChapters}
            expandedCategories={expandedCategories}
            onToggleChapter={toggleChapter}
            onToggleCategory={toggleCategory}
            renderChapterRight={(chapterId) => (
              <LevelSelector
                value={getLevel('chapter', chapterId)}
                onChange={(w) => setLevel('chapter', chapterId, w)}
              />
            )}
            renderCategoryRight={({ category }) => (
              <LevelSelector
                value={getLevel('category', category.id)}
                onChange={(w) => setLevel('category', category.id, w)}
              />
            )}
            renderSubcategory={({ subcategory }) => (
              <SubcategoryLevelRow
                subcategory={subcategory}
                value={getLevel('subcategory', subcategory.id)}
                onChange={(w) => setLevel('subcategory', subcategory.id, w)}
              />
            )}
          />
        </div>
      )}

      <Group justify="space-between" className={styles.footerRow}>
        <Group gap="xs">
          <Button
            variant="default"
            size="xs"
            leftSection={<CheckCheck size={14} />}
            onClick={handleSelectAll}
            disabled={taxonomyLoading}
          >
            {t('preferences.actions.selectAll')}
          </Button>
          <Button
            variant="subtle"
            color="red"
            size="xs"
            leftSection={<RotateCcw size={14} />}
            onClick={handleReset}
            disabled={draft.size === 0}
          >
            {t('preferences.actions.reset')}
          </Button>
        </Group>
        <Button
          color="barter"
          leftSection={<Save size={14} />}
          onClick={handleSave}
          disabled={!isDirty}
          loading={replaceMutation.isPending}
        >
          {t('common.save')}
        </Button>
      </Group>
    </div>
  );
};
