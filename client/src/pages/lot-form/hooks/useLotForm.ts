import { useMemo, useCallback } from 'react';
import { useForm } from '@mantine/form';
import type { CityOption, DistrictOption, RegionOption } from '@/types/geo.dto';
import type { TaxonomyChapter } from '@/types/taxonomy';
import type { TFunction } from 'i18next';

export type FormValues = {
  taxonomyPath: string;
  chapterId: number | null;
  categoryId: number | null;
  subcategoryId: number | null;
  generalDescription: string;
  characteristicsDescription: string;
  quantity: number;
  regionId: string;
  cityId: string;
  districtId: string;
  visibilityStatus: boolean;
  archivationDate?: string | null;
};

export const useLotForm = ({
  t,
  taxonomy,
  regions,
  cities,
  districts,
}: {
  t: TFunction;
  taxonomy: TaxonomyChapter[];
  regions: RegionOption[];
  cities: CityOption[];
  districts: DistrictOption[];
}) => {
  const form = useForm<FormValues>({
    initialValues: {
      taxonomyPath: '',
      chapterId: null,
      categoryId: null,
      subcategoryId: null,
      generalDescription: '',
      characteristicsDescription: '',
      quantity: 1,
      regionId: '',
      cityId: '',
      districtId: '',
      visibilityStatus: true,
    },
    validate: {
      taxonomyPath: (value) =>
        !value ? t('lotForm.validation.taxonomyRequired') : null,
      generalDescription: (value) =>
        value.trim().length === 0
          ? t('lotForm.validation.generalDescriptionRequired')
          : null,
      characteristicsDescription: (value) =>
        value.trim().length === 0
          ? t('lotForm.validation.characteristicsRequired')
          : null,
      quantity: (value) =>
        value < 1 ? t('lotForm.validation.minQuantity') : null,
      regionId: (value) => (!value ? t('auth.region') : null),
      cityId: (value) => (!value ? t('auth.city') : null),
    },
  });

  // -----------------------------
  // Taxonomy resolver
  // -----------------------------
  const resolveTaxonomyPath = useCallback(
    (chapterId: number, categoryId: number, subcategoryId: number | null) => {
      const chapter = taxonomy.find((t) => t.id === chapterId);
      const category = chapter?.categories.find((c) => c.id === categoryId);
      const subcategory = subcategoryId
        ? category?.subcategories.find((s) => s.id === subcategoryId)
        : null;

      if (!chapter || !category) return '';

      return subcategory
        ? `${chapter.name} -> ${category.name} -> ${subcategory.name}`
        : `${chapter.name} -> ${category.name}`;
    },
    [taxonomy],
  );

  // -----------------------------
  // Location change handlers
  // -----------------------------
  const handleRegionChange = useCallback(
    (value: string | null) => {
      form.setFieldValue('regionId', value || '');
      form.setFieldValue('cityId', '');
      form.setFieldValue('districtId', '');
    },
    [form],
  );

  const handleCityChange = useCallback(
    (value: string | null) => {
      form.setFieldValue('cityId', value || '');
      form.setFieldValue('districtId', '');
    },
    [form],
  );

  // -----------------------------
  // Options (derived UI)
  // -----------------------------
  const regionOptions = useMemo(
    () =>
      [...regions]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((r) => ({ value: String(r.id), label: r.name })),
    [regions],
  );

  const cityOptions = useMemo(
    () =>
      [...cities]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => ({ value: String(c.id), label: c.name })),
    [cities],
  );

  const districtOptions = useMemo(
    () =>
      [...districts]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((d) => ({ value: String(d.id), label: d.name })),
    [districts],
  );

  // -----------------------------
  // Derived location path
  // -----------------------------
  const locationPath = useMemo(() => {
    const region = regionOptions.find(
      (o) => o.value === form.values.regionId,
    )?.label;

    const city = cityOptions.find((o) => o.value === form.values.cityId)?.label;

    const district = districtOptions.find(
      (o) => o.value === form.values.districtId,
    )?.label;

    return [region, city, district].filter(Boolean).join(' → ');
  }, [
    form.values.regionId,
    form.values.cityId,
    form.values.districtId,
    regionOptions,
    cityOptions,
    districtOptions,
  ]);

  return {
    // form core
    ...form,

    // helpers
    resolveTaxonomyPath,

    // location
    handleRegionChange,
    handleCityChange,

    // derived UI
    regionOptions,
    cityOptions,
    districtOptions,
    locationPath,
  };
};
