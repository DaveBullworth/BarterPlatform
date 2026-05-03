import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { EMPTY_LOT_FORM, type LotFormValues } from './model';

export const useLotFormState = (initialValues?: LotFormValues | null) => {
  const { t } = useTranslation();

  const form = useForm<LotFormValues>({
    initialValues: initialValues ?? EMPTY_LOT_FORM,
    validate: {
      taxonomyPath: (v) =>
        !v ? t('lotForm.validation.taxonomyRequired') : null,
      generalDescription: (v) =>
        !v.trim() ? t('lotForm.validation.generalDescriptionRequired') : null,
      characteristicsDescription: (v) =>
        !v.trim() ? t('lotForm.validation.characteristicsRequired') : null,
      quantity: (v) => (v < 1 ? t('lotForm.validation.minQuantity') : null),
      regionId: (v) => (!v ? t('auth.region') : null),
      cityId: (v) => (!v ? t('auth.city') : null),
    },
  });

  const setTaxonomy = (params: {
    chapterId: number;
    categoryId: number;
    subcategoryId: number | null;
    path: string;
  }) => {
    form.setValues({
      chapterId: params.chapterId,
      categoryId: params.categoryId,
      subcategoryId: params.subcategoryId,
      taxonomyPath: params.path,
    });
  };

  const setGeo = (geo: {
    regionId: string;
    cityId: string;
    districtId: string;
  }) => {
    form.setValues({
      regionId: geo.regionId,
      cityId: geo.cityId,
      districtId: geo.districtId,
    });
  };

  return {
    form,
    setTaxonomy,
    setGeo,
  };
};
