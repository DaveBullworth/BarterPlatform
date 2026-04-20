import { Group, Loader, Stack } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import ConfirmModal from '@/shared/ui/ConfirmModal';
import StatusActionModal, {
  type LotStatusAction,
} from '@/shared/ui/StatusActionModal';
import GeoModal from './modals/GeoModal';
import { LotForm } from './form/LotForm';
import {
  fetchTaxonomyIfNeeded,
  selectTaxonomy,
  selectTaxonomyStatus,
} from '@/store/taxonomySlice';
import { selectCurrentUser } from '@/store/userSlice';
import { getLotById } from '@/http/lots';
import { getLotImages } from '@/http/media';
import { LOT_VISIBILITY_STATUS } from '@/types/lot';
import { handleApiError } from '@/shared/utils/handleApiError';
import { goToLotView } from '@/shared/utils/navigation';
import { getCities, getDistricts, getRegions } from '@/http/geography';
import { LotFormHeader } from './components/LotFormHeader';
import { TaxonomyPickerModal } from './modals/TaxonomyPickerModal';
import { useLotForm } from './hooks/useLotForm';
import { useLotImages } from './hooks/useLotImages';
import { useLotSubmit } from './hooks/useLotSubmit';
import { useLotStatus } from './hooks/useLotStatus';
import { getApiErrorStatusCode } from '@/shared/utils/getApiErrorStatusCode';
import { ErrorStub } from '@/shared/ui/ErrorStub';
import type { TaxonomyCategory } from '@/types/taxonomy';
import type { AppDispatch } from '@/store';
import type { CityOption, DistrictOption, RegionOption } from '@/types/geo.dto';

const getCategoryKey = (chapterId: number, categoryId: number) =>
  `${chapterId}:${categoryId}`;

const MAX_IMAGES = 3;

export const LotFormPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditMode = Boolean(id);

  const taxonomy = useSelector(selectTaxonomy);
  const taxonomyStatus = useSelector(selectTaxonomyStatus);
  const currentUser = useSelector(selectCurrentUser);

  const [taxonomyOpened, taxonomyControls] = useDisclosure(false);
  const [geoOpened, geoControls] = useDisclosure(false);
  const [unsavedChangesModalOpen, setUnsavedChangesModalOpen] = useState(false);

  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    new Set(),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEditMode);
  const [shouldNavigate, setShouldNavigate] = useState<string | boolean>(false);
  const [isArchived, setIsArchived] = useState(false);
  const [statusActionModal, setStatusActionModal] =
    useState<LotStatusAction | null>(null);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [isError, setIsError] = useState(false);

  const {
    values,
    getInputProps,
    setValues,
    setFieldValue,
    setFieldError,
    setDirty,
    resetDirty,
    isDirty,
    onSubmit,
    errors,
    resolveTaxonomyPath,
    handleRegionChange,
    handleCityChange,
    regionOptions,
    cityOptions,
    districtOptions,
    locationPath,
  } = useLotForm({ t, taxonomy, regions, cities, districts });

  const {
    newImages,
    pendingDeleteImageIds,
    pendingPrimaryImageId,
    totalImagesCount,
    renderedImages,
    computeImagesDirty,
    handleAddImage,
    setExistingImagePrimary,
    setNewImagePrimary,
    removeExistingImage,
    removeNewImage,
    setInitialImages,
    resetImages,
  } = useLotImages();

  const { isValidForSubmit, submitLot } = useLotSubmit({
    t,
    isEditMode,
    id,
    pendingDeleteImageIds,
    pendingPrimaryImageId,
    newImages,
    resetImages,
    resetDirty,
    setLoading,
    setShouldNavigate,
  });

  const { changeLotStatus } = useLotStatus({
    t,
    setLoading,
  });

  const isFormDirty = isDirty() || computeImagesDirty();

  const blocker = useBlocker(isFormDirty);

  const load = useCallback(
    async (id: string) => {
      setInitializing(true);
      try {
        const [lot, images] = await Promise.all([
          getLotById(id),
          getLotImages(id),
        ]);
        const path = resolveTaxonomyPath(
          lot.chapterId,
          lot.categoryId,
          lot.subcategoryId,
        );

        setValues({
          taxonomyPath: path,
          chapterId: lot.chapterId,
          categoryId: lot.categoryId,
          subcategoryId: lot.subcategoryId,
          generalDescription: lot.generalDescription,
          characteristicsDescription: lot.characteristicsDescription,
          quantity: lot.quantity,
          regionId: lot.region ? String(lot.region.id) : '',
          cityId: lot.city ? String(lot.city.id) : '',
          districtId: lot.district ? String(lot.district.id) : '',
          visibilityStatus:
            lot.visibilityStatus === LOT_VISIBILITY_STATUS.ACTIVE,
          archivationDate: lot.archivationDate ?? null,
        });
        setIsArchived(lot.visibilityStatus === LOT_VISIBILITY_STATUS.ARCHIVED);
        resetDirty();

        setInitialImages(images.images);
      } catch (error) {
        const status = getApiErrorStatusCode(error);

        setErrorStatus(status);
        setIsError(true);
        handleApiError(error, t);
      } finally {
        setInitializing(false);
      }
    },
    [t, resetDirty, resolveTaxonomyPath, setInitialImages, setValues],
  );

  const initExpandedFromForm = useCallback(() => {
    const { chapterId, categoryId } = values;

    if (!chapterId) {
      setExpandedChapters(new Set());
      setExpandedCategories(new Set());
      return;
    }

    const chapters = new Set<number>();
    const categories = new Set<string>();

    chapters.add(chapterId);

    if (categoryId) {
      categories.add(getCategoryKey(chapterId, categoryId));
    }

    setExpandedChapters(chapters);
    setExpandedCategories(categories);
  }, [values]);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setUnsavedChangesModalOpen(true);
    }
  }, [blocker.state]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty()) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      newImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [isDirty, newImages]);

  useEffect(() => {
    dispatch(fetchTaxonomyIfNeeded());
  }, [dispatch]);

  useEffect(() => {
    getRegions().then(setRegions).catch(console.error);
  }, []);

  useEffect(() => {
    if (isEditMode || !currentUser) return;

    const nextRegionId = currentUser.region
      ? String(currentUser.region.id)
      : '';
    const nextCityId = currentUser.city ? String(currentUser.city.id) : '';
    const nextDistrictId = currentUser.district
      ? String(currentUser.district.id)
      : '';

    setValues({
      regionId: nextRegionId,
      cityId: nextCityId,
      districtId: nextDistrictId,
    });
  }, [currentUser, isEditMode, setValues]);

  useEffect(() => {
    if (taxonomyOpened) {
      initExpandedFromForm();
    }
  }, [taxonomyOpened, initExpandedFromForm]);

  useEffect(() => {
    if (!values.regionId) {
      setCities([]);
      setDistricts([]);
      return;
    }

    getCities(Number(values.regionId)).then(setCities).catch(console.error);
  }, [values.regionId]);

  useEffect(() => {
    if (!values.cityId) {
      setDistricts([]);
      return;
    }

    getDistricts(Number(values.cityId)).then(setDistricts).catch(console.error);
  }, [values.cityId]);

  useEffect(() => {
    if (!id) return;
    void load(id);
  }, [id, load]);

  useEffect(() => {
    if (typeof shouldNavigate !== 'string') return;
    goToLotView(navigate, shouldNavigate);
  }, [shouldNavigate, navigate]);

  const handlePickTaxonomy = (
    chapterId: number,
    category: TaxonomyCategory,
    subcategoryId: number | null,
  ) => {
    const chapter = taxonomy.find((item) => item.id === chapterId);
    const subcategory = subcategoryId
      ? category.subcategories.find((item) => item.id === subcategoryId)
      : null;

    if (!chapter) return;

    const path = subcategory
      ? `${chapter.name} -> ${category.name} -> ${subcategory.name}`
      : `${chapter.name} -> ${category.name}`;

    setValues({
      chapterId,
      categoryId: category.id,
      subcategoryId,
      taxonomyPath: path,
    });

    if (!isEditMode) {
      setDirty({
        chapterId: true,
        categoryId: true,
        subcategoryId: true,
        taxonomyPath: true,
      });
    }

    taxonomyControls.close();
  };

  const onSubmitForm = onSubmit(async (values) => {
    if (!isValidForSubmit(values)) {
      if (!values.chapterId || !values.categoryId) {
        setFieldError('taxonomyPath', t('lotForm.validation.taxonomyRequired'));
      }
      if (!values.regionId) {
        setFieldError('regionId', t('auth.region'));
      }
      if (!values.cityId) {
        setFieldError('cityId', t('auth.city'));
      }
      return;
    }

    await submitLot(values);
  });

  const handleConfirmStatusAction = async () => {
    if (!id || !statusActionModal) return;

    const updatedLot = await changeLotStatus({
      lotId: id,
      action: statusActionModal,
    });

    if (!updatedLot) return;

    const nextIsArchived =
      updatedLot.visibilityStatus === LOT_VISIBILITY_STATUS.ARCHIVED;

    setIsArchived(nextIsArchived);

    if (!nextIsArchived) {
      setFieldValue(
        'visibilityStatus',
        updatedLot.visibilityStatus === LOT_VISIBILITY_STATUS.ACTIVE,
      );
    } else {
      setFieldValue('archivationDate', updatedLot.archivationDate ?? null);
    }

    resetDirty();
    setShouldNavigate(updatedLot.id);
    setStatusActionModal(null);
  };

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

  const showDeactivateAction = isEditMode && Boolean(id) && !isArchived;
  const showUnarchiveAction = isEditMode && Boolean(id) && isArchived;

  if (
    taxonomyStatus === 'idle' ||
    taxonomyStatus === 'loading' ||
    (isEditMode && initializing)
  ) {
    return (
      <Group justify="center" style={{ width: '100%' }}>
        <Loader />
      </Group>
    );
  }

  if (isError) {
    return (
      <ErrorStub
        status={errorStatus ?? undefined}
        t={t}
        onRetry={() => {
          setIsError(false);
          setErrorStatus(null);
          if (id) load(id);
        }}
        onBack={() => navigate(-1)}
      />
    );
  }

  return (
    <Stack maw={860} w="100%" mx="auto">
      <LotFormHeader isEditMode={isEditMode} isFormDirty={isFormDirty} t={t} />

      <LotForm
        onSubmit={onSubmitForm}
        taxonomy={{
          value: values.taxonomyPath,
          error: errors.taxonomyPath,
          onOpen: taxonomyControls.open,
        }}
        geo={{
          value: locationPath,
          error: errors.regionId || errors.cityId,
          onOpen: geoControls.open,
        }}
        images={{
          images: renderedImages,
          totalCount: totalImagesCount,
          maxImages: MAX_IMAGES,
          onAdd: handleAddImage,
          onRemoveExisting: removeExistingImage,
          onRemoveNew: removeNewImage,
          onSetPrimaryExisting: setExistingImagePrimary,
          onSetPrimaryNew: setNewImagePrimary,
        }}
        basicInfo={{
          values,
          isArchived,
          getInputProps,
          setFieldValue,
        }}
        actions={{
          isFormDirty,
          loading,
          showDeactivate: showDeactivateAction,
          showUnarchive: showUnarchiveAction,
          onCancel: () => navigate(-1),
          onDeactivate: () => setStatusActionModal('deactivate'),
          onUnarchive: () => setStatusActionModal('unarchive'),
        }}
        t={t}
      />

      <TaxonomyPickerModal
        opened={taxonomyOpened}
        onClose={() => taxonomyControls.close()}
        title={t('lotForm.modal.selectCategory')}
        taxonomy={taxonomy}
        expandedChapters={expandedChapters}
        expandedCategories={expandedCategories}
        onToggleChapter={toggleChapter}
        onToggleCategory={toggleCategory}
        values={values}
        onPick={handlePickTaxonomy}
      />

      <GeoModal
        opened={geoOpened}
        onClose={geoControls.close}
        value={values}
        onChange={(val) => {
          setFieldValue('regionId', val.regionId);
          setFieldValue('cityId', val.cityId);
          setFieldValue('districtId', val.districtId);
        }}
        regionOptions={regionOptions}
        cityOptions={cityOptions}
        districtOptions={districtOptions}
        onRegionChange={handleRegionChange}
        onCityChange={handleCityChange}
        errors={{
          regionId: errors.regionId,
          cityId: errors.cityId,
        }}
        t={t}
      />

      <StatusActionModal
        action={statusActionModal}
        loading={loading}
        onConfirm={handleConfirmStatusAction}
        onClose={() => setStatusActionModal(null)}
        t={t}
      />

      <ConfirmModal
        opened={unsavedChangesModalOpen}
        title={t('lotForm.status.unsaved')}
        message={t('lotForm.modal.unsavedWarning')}
        confirmLabel={t('lotForm.actions.continue')}
        cancelLabel={t('lotForm.actions.cancel')}
        onConfirm={() => {
          if (blocker.state !== 'blocked') {
            return;
          }
          blocker.proceed?.();
        }}
        onCancel={() => {
          setUnsavedChangesModalOpen(false);
          if (unsavedChangesModalOpen && blocker.state === 'blocked') {
            blocker.reset();
          }
        }}
      />
    </Stack>
  );
};
