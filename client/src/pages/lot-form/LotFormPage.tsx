import { Stack, Loader, Group } from '@mantine/core';
import { useParams } from 'react-router-dom';

import { useSelfUser } from '@/entities/user';
import { useTaxonomy, type Category } from '@/entities/taxonomy';
import {
  useRegionOptions,
  useCityOptions,
  useDistrictOptions,
} from '@/entities/geography';
import { useNavigation } from '@/shared/lib/navigation';
import { ErrorStub } from '@/shared/ui';
import {
  LotForm,
  LotFormHeader,
  useLotFormData,
  useLotFormState,
  useLotImages,
  useLotSubmit,
  MAX_LOT_IMAGES,
  EMPTY_LOT_FORM,
} from '@/features/lot-form';
import { getApiErrorStatusCode } from '@/shared/lib';

export const LotFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const { back } = useNavigation();
  const { data: selfUser } = useSelfUser();
  const { data: taxonomy = [] } = useTaxonomy();

  const isEditMode = Boolean(id);

  // Загрузка данных (edit mode)
  const {
    lot,
    images: serverImages,
    initialValues,
    isArchived,
    isLoading,
    isError,
    error,
  } = useLotFormData(id);

  const createModeDefaults =
    !isEditMode && selfUser
      ? {
          regionId: selfUser.region ? String(selfUser.region.id) : '',
          cityId: selfUser.city ? String(selfUser.city.id) : '',
          districtId: selfUser.district ? String(selfUser.district.id) : '',
        }
      : {};

  // Форма
  const { form, setTaxonomy, setGeo } = useLotFormState(
    initialValues
      ? initialValues
      : { ...EMPTY_LOT_FORM, ...createModeDefaults },
  );

  // Изображения
  const lotImages = useLotImages(serverImages);

  // Geo options
  const regionId = form.values.regionId ? Number(form.values.regionId) : null;
  const cityId = form.values.cityId ? Number(form.values.cityId) : null;
  const regionOptions = useRegionOptions();
  const cityOptions = useCityOptions(regionId);
  const districtOptions = useDistrictOptions(cityId);

  // Geo display path
  const geoDisplayPath = [
    regionOptions.find((o) => o.value === form.values.regionId)?.label,
    cityOptions.find((o) => o.value === form.values.cityId)?.label,
    districtOptions.find((o) => o.value === form.values.districtId)?.label,
  ]
    .filter(Boolean)
    .join(' → ');

  // Submit
  const { submit, isPending } = useLotSubmit({
    lotId: id,
    deletedImageIds: lotImages.deletedIds,
    pendingPrimaryId: lotImages.pendingPrimaryId,
    newImages: lotImages.newImages,
    onSuccess: () => {
      lotImages.reset();
      form.resetDirty();
    },
  });

  const isFormDirty = form.isDirty() || lotImages.isDirty;

  // Taxonomy pick handler
  const handleTaxonomyPick = (
    chapterId: number,
    category: Category,
    subcategoryId: number | null,
  ) => {
    const chapter = taxonomy.find((c) => c.id === chapterId);
    if (!chapter) return;

    const subcategory = subcategoryId
      ? category.subcategories.find((s) => s.id === subcategoryId)
      : null;

    const path = subcategory
      ? `${chapter.name} → ${category.name} → ${subcategory.name}`
      : `${chapter.name} → ${category.name}`;

    setTaxonomy({ chapterId, categoryId: category.id, subcategoryId, path });
  };

  if (isLoading) {
    return (
      <Group justify="center" style={{ width: '100%' }}>
        <Loader />
      </Group>
    );
  }

  if (isError) {
    return (
      <ErrorStub
        status={getApiErrorStatusCode(error)}
        onRetry={() => {}}
        onBack={back}
      />
    );
  }

  return (
    <Stack maw={860} w="100%" mx="auto">
      <LotFormHeader isEditMode={isEditMode} isFormDirty={isFormDirty} />

      <LotForm
        form={form}
        onSubmit={() => submit(form.values)}
        isFormDirty={isFormDirty}
        onTaxonomyPick={handleTaxonomyPick}
        geoDisplayPath={geoDisplayPath}
        onGeoChange={setGeo}
        images={lotImages.rendered}
        imagesTotalCount={lotImages.totalCount}
        maxImages={MAX_LOT_IMAGES}
        onImagesAdd={lotImages.addImages}
        onImageRemoveExisting={lotImages.removeExisting}
        onImageRemoveNew={lotImages.removeNew}
        onImageSetPrimaryExisting={lotImages.setPrimaryExisting}
        onImageSetPrimaryNew={lotImages.setPrimaryNew}
        isArchived={isArchived}
        isEditMode={isEditMode}
        lot={lot}
        loading={isPending}
      />
    </Stack>
  );
};
