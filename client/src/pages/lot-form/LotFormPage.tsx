import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Collapse,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import {
  BadgeQuestionMark,
  Building2,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch } from '@/store';
import {
  fetchTaxonomyIfNeeded,
  selectTaxonomy,
  selectTaxonomyStatus,
} from '@/store/taxonomySlice';
import { selectCurrentUser } from '@/store/userSlice';
import type { TaxonomyCategory } from '@/types/taxonomy';
import { createLot, getLotById, updateLot } from '@/http/lots';
import {
  deleteLotImage,
  getLotImages,
  setPrimaryLotImage,
  uploadLotImage,
} from '@/http/media';
import { LOT_VISIBILITY_STATUS, type CreateLotDto } from '@/types/lot';
import { USER_ROLES } from '@/shared/constants/user-role';
import { notify } from '@/shared/utils/notifications';
import { handleApiError } from '@/shared/utils/handleApiError';
import { goToLotView } from '@/shared/utils/navigation';
import { chapterIcons } from '@/shared/utils/chapterIcons';
import { ChapterItem } from '@/app/layout/categoriesDrawer/ChapterItem';
import { CategoryItem } from '@/app/layout/categoriesDrawer/CategoryItem';
import { SkeletonList } from '@/app/layout/categoriesDrawer/ChapterItemSkeleton';
import { getCities, getDistricts, getRegions } from '@/http/geography';
import type { CityOption, DistrictOption, RegionOption } from '@/types/geo.dto';

type FormValues = {
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

type ExistingImage = {
  imageId: string;
  isPrimary: boolean;
  mimeType: string;
  data: string;
};

type NewImage = {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
};

type LotStatusAction = 'deactivate' | 'unarchive';

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
  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;

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
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [pendingDeleteImageIds, setPendingDeleteImageIds] = useState<string[]>(
    [],
  );
  const [pendingPrimaryImageId, setPendingPrimaryImageId] = useState<
    string | null
  >(null);
  const [showContent, setShowContent] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState<string | boolean>(false);
  const [initialImagesState, setInitialImagesState] = useState<{
    primaryImageId: string | null;
    existingIds: string[];
  } | null>(null);
  const [isArchived, setIsArchived] = useState(false);
  const [statusActionModal, setStatusActionModal] =
    useState<LotStatusAction | null>(null);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);

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
  } = useForm<FormValues>({
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

  const computeImagesDirty = () => {
    if (!initialImagesState) return !!newImages.length;

    const currentPrimary =
      existingImages.find((img) => img.isPrimary)?.imageId ?? null;

    const currentExistingIds = existingImages.map((img) => img.imageId);

    const isPrimaryChanged =
      currentPrimary !== initialImagesState.primaryImageId;

    const isExistingChanged =
      currentExistingIds.length !== initialImagesState.existingIds.length ||
      currentExistingIds.some(
        (id, idx) => id !== initialImagesState.existingIds[idx],
      );

    const isNewImagesAdded = newImages.length > 0;
    const isDeleted = pendingDeleteImageIds.length > 0;

    return (
      isPrimaryChanged || isExistingChanged || isNewImagesAdded || isDeleted
    );
  };

  const isFormDirty = isDirty() || computeImagesDirty();

  const blocker = useBlocker(isFormDirty);

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

  const resolveTaxonomyPath = useCallback(
    (chapterId: number, categoryId: number, subcategoryId: number | null) => {
      const chapter = taxonomy.find((item) => item.id === chapterId);
      const category = chapter?.categories.find(
        (item) => item.id === categoryId,
      );
      const subcategory = subcategoryId
        ? category?.subcategories.find((item) => item.id === subcategoryId)
        : null;

      if (!chapter || !category) return '';

      return subcategory
        ? `${chapter.name} -> ${category.name} -> ${subcategory.name}`
        : `${chapter.name} -> ${category.name}`;
    },
    [taxonomy],
  );

  const regionOptions = useMemo(
    () =>
      [...regions]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((region) => ({ value: String(region.id), label: region.name })),
    [regions],
  );

  const cityOptions = useMemo(
    () =>
      [...cities]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((city) => ({ value: String(city.id), label: city.name })),
    [cities],
  );

  const districtOptions = useMemo(
    () =>
      [...districts]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((district) => ({
          value: String(district.id),
          label: district.name,
        })),
    [districts],
  );

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

    const nextRegionId = currentUser.region ? String(currentUser.region.id) : '';
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

    getCities(Number(values.regionId))
      .then(setCities)
      .catch(console.error);
  }, [values.regionId]);

  useEffect(() => {
    if (!values.cityId) {
      setDistricts([]);
      return;
    }

    getDistricts(Number(values.cityId))
      .then(setDistricts)
      .catch(console.error);
  }, [values.cityId]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

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

        setExistingImages(images.images);

        setInitialImagesState({
          primaryImageId:
            images.images.find((img) => img.isPrimary)?.imageId ?? null,
          existingIds: images.images.map((img) => img.imageId),
        });
      } catch (error) {
        handleApiError(error, t);
      } finally {
        setInitializing(false);
      }
    };

    void load();
  }, [id, resolveTaxonomyPath, setValues, resetDirty, t]);

  useEffect(() => {
    if (typeof shouldNavigate !== 'string') return;
    goToLotView(navigate, shouldNavigate);
  }, [shouldNavigate, navigate]);

  const totalImagesCount = existingImages.length + newImages.length;

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

    setShowContent(false);
    taxonomyControls.close();
  };

  const handleAddImage = (files: File[]) => {
    const freeSlots = MAX_IMAGES - totalImagesCount;

    if (freeSlots <= 0) return;

    const hasPrimary =
      existingImages.some((image) => image.isPrimary) ||
      newImages.some((image) => image.isPrimary);

    const nextImages = files.slice(0, freeSlots).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: false,
    }));

    if (!hasPrimary && nextImages.length > 0) {
      nextImages[0].isPrimary = true;
    }

    setNewImages((prev) => [...prev, ...nextImages]);
  };

  const handleRegionChange = (value: string | null) => {
    setFieldValue('regionId', value || '');
    setFieldValue('cityId', '');
    setFieldValue('districtId', '');
  };

  const handleCityChange = (value: string | null) => {
    setFieldValue('cityId', value || '');
    setFieldValue('districtId', '');
  };

  const setExistingImagePrimary = (imageId: string) => {
    setExistingImages((prev) =>
      prev.map((image) => ({ ...image, isPrimary: image.imageId === imageId })),
    );
    setNewImages((prev) => prev.map((image) => ({ ...image, isPrimary: false })));

    setPendingPrimaryImageId(imageId);
  };

  const setNewImagePrimary = (id: string) => {
    setNewImages((prev) => {
      if (!prev.some((item) => item.id === id)) return prev;
      return prev.map((item) => ({ ...item, isPrimary: item.id === id }));
    });

    setExistingImages((prev) =>
      prev.map((image) => ({ ...image, isPrimary: false })),
    );
    setPendingPrimaryImageId(null);
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages((prev) =>
      prev.filter((item) => item.imageId !== imageId),
    );
    setPendingDeleteImageIds((prev) => [...prev, imageId]);
    if (pendingPrimaryImageId === imageId) {
      setPendingPrimaryImageId(null);
    }
  };

  const removeNewImage = (imageId: string) => {
    setNewImages((prev) => {
      const target = prev.find((item) => item.id === imageId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const filtered = prev.filter((item) => item.id !== imageId);
      if (
        target?.isPrimary &&
        filtered.length > 0 &&
        !filtered.some((item) => item.isPrimary)
      ) {
        return filtered.map((item, index) => ({
          ...item,
          isPrimary: index === 0,
        }));
      }
      return filtered;
    });
  };

  const onSubmitForm = onSubmit(async (values) => {
    if (!values.chapterId || !values.categoryId) {
      setFieldError('taxonomyPath', t('lotForm.validation.taxonomyRequired'));
      return;
    }
    if (!values.regionId) {
      setFieldError('regionId', t('auth.region'));
      return;
    }
    if (!values.cityId) {
      setFieldError('cityId', t('auth.city'));
      return;
    }

    setLoading(true);
    try {
      const dto: CreateLotDto = {
        chapterId: values.chapterId,
        categoryId: values.categoryId,
        subcategoryId: values.subcategoryId ?? undefined,
        generalDescription: values.generalDescription,
        characteristicsDescription: values.characteristicsDescription,
        quantity: values.quantity,
        regionId: Number(values.regionId),
        cityId: Number(values.cityId),
        districtId: values.districtId ? Number(values.districtId) : null,
        visibilityStatus: values.visibilityStatus
          ? LOT_VISIBILITY_STATUS.ACTIVE
          : LOT_VISIBILITY_STATUS.HIDDEN,
      };

      const lot =
        isEditMode && id ? await updateLot(id, dto) : await createLot(dto);
      const lotId = lot.id;

      for (const imageId of pendingDeleteImageIds) {
        await deleteLotImage(imageId);
      }

      let nextPrimaryImageId = pendingPrimaryImageId;

      for (const image of newImages) {
        const uploaded = await uploadLotImage(lotId, image.file);
        if (image.isPrimary) {
          nextPrimaryImageId = uploaded.imageId;
        }
      }

      if (nextPrimaryImageId) {
        await setPrimaryLotImage(lotId, nextPrimaryImageId);
      }

      notify({
        title: t('common.success'),
        message: isEditMode
          ? t('lotForm.success.updated')
          : t('lotForm.success.created'),
        color: 'green',
        icon: <Check size={16} />,
      });

      setNewImages([]);
      setInitialImagesState(null);
      resetDirty();

      setShouldNavigate(lotId);
    } catch (error) {
      handleApiError(error, t);
    } finally {
      setLoading(false);
    }
  });

  const handleConfirmStatusAction = async () => {
    if (!id || !statusActionModal) return;

    const isDeactivateAction = statusActionModal === 'deactivate';
    const nextStatus = isDeactivateAction
      ? LOT_VISIBILITY_STATUS.ARCHIVED
      : LOT_VISIBILITY_STATUS.HIDDEN;

    setLoading(true);
    try {
      const updatedLot = await updateLot(id, { visibilityStatus: nextStatus });
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

      notify({
        title: t('common.success'),
        message: isDeactivateAction
          ? t('lotForm.success.deactivated')
          : t('lotForm.success.unarchived'),
        color: 'green',
        icon: <Check size={16} />,
      });
    } catch (error) {
      handleApiError(error, t);
    } finally {
      setLoading(false);
      setStatusActionModal(null);
    }
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

  const renderedImages = useMemo(() => {
    const existing = existingImages.map((image) => ({
      key: image.imageId,
      imageId: image.imageId,
      isPrimary: image.isPrimary,
      src: `data:${image.mimeType};base64,${image.data}`,
      kind: 'existing' as const,
    }));

    const fresh = newImages.map((image) => ({
      key: image.id,
      imageId: image.id,
      isPrimary: image.isPrimary,
      src: image.previewUrl,
      kind: 'new' as const,
    }));

    return [...existing, ...fresh];
  }, [existingImages, newImages]);

  const showDeactivateAction = isEditMode && Boolean(id) && !isArchived;
  const showUnarchiveAction =
    isEditMode && Boolean(id) && isArchived && isAdmin;
  const selectedRegionName =
    regionOptions.find((option) => option.value === values.regionId)?.label ??
    '';
  const selectedCityName =
    cityOptions.find((option) => option.value === values.cityId)?.label ?? '';
  const selectedDistrictName =
    districtOptions.find((option) => option.value === values.districtId)
      ?.label ?? '';
  const locationPath = [selectedRegionName, selectedCityName, selectedDistrictName]
    .filter(Boolean)
    .join(' → ');

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

  return (
    <Stack maw={860} w="100%" mx="auto">
      <Group justify="space-between" align="center">
        <Title order={2}>
          {isEditMode ? t('lotForm.title.edit') : t('lotForm.title.create')}
        </Title>
        <Badge color={isFormDirty ? 'yellow' : 'green'}>
          {isFormDirty
            ? t('lotForm.status.unsaved')
            : t('lotForm.status.saved')}
        </Badge>
      </Group>

      <form onSubmit={onSubmitForm}>
        <Stack>
          <Card withBorder radius="md" p="md">
            <Stack>
              <Text fw={700}>{t('lotForm.taxonomy.title')}</Text>
              <TextInput
                label={t('lotForm.taxonomy.selected')}
                placeholder={t('lotForm.taxonomy.placeholder')}
                readOnly
                value={values.taxonomyPath}
                error={errors.taxonomyPath}
                styles={{
                  input: {
                    fontStyle: 'italic',
                  },
                }}
              />
              <Button variant="default" onClick={taxonomyControls.open}>
                {t('lotForm.taxonomy.selectButton')}
              </Button>
            </Stack>
          </Card>

          <Card withBorder radius="md" p="md">
            <Stack>
              <Text fw={700}>{t('lotForm.geo.title')}</Text>
              <TextInput
                label={t('lotForm.geo.selected')}
                placeholder={t('lotForm.geo.placeholder')}
                readOnly
                value={locationPath}
                error={errors.regionId || errors.cityId}
                styles={{
                  input: {
                    fontStyle: 'italic',
                  },
                }}
              />
              <Button variant="default" onClick={geoControls.open}>
                {t('lotForm.geo.selectButton')}
              </Button>
            </Stack>
          </Card>

          <Card withBorder radius="md" p="md">
            <Stack>
              <Group justify="space-between">
                <Text fw={700}>{t('lotForm.images.title')}</Text>
                <Text size="sm" c="dimmed">
                  {totalImagesCount}/{MAX_IMAGES}
                </Text>
              </Group>

              <Group>
                {renderedImages.map((image) => (
                  <Card key={image.key} withBorder p="xs" w={180}>
                    <Stack gap="xs">
                      <Box
                        h={120}
                        style={{ overflow: 'hidden', borderRadius: 8 }}
                      >
                        <img
                          src={image.src}
                          alt="lot"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </Box>

                      <Group justify="space-between" wrap="nowrap">
                        {image.isPrimary ? (
                          <Badge color="yellow">
                            {t('lotForm.images.primary')}
                          </Badge>
                        ) : (
                          <Button
                            variant="subtle"
                            size="compact-xs"
                            onClick={() =>
                              image.kind === 'existing'
                                ? setExistingImagePrimary(image.imageId)
                                : setNewImagePrimary(image.imageId)
                            }
                          >
                            {t('lotForm.images.setPrimary')}
                          </Button>
                        )}

                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() =>
                            image.kind === 'existing'
                              ? removeExistingImage(image.imageId)
                              : removeNewImage(image.imageId)
                          }
                        >
                          <Trash2 size={14} />
                        </ActionIcon>
                      </Group>
                    </Stack>
                  </Card>
                ))}

                {totalImagesCount < MAX_IMAGES && (
                  <Dropzone
                    accept={['image/png', 'image/jpeg']}
                    maxSize={8 * 1024 * 1024}
                    onDrop={handleAddImage}
                    style={{
                      width: 180,
                      height: 180,
                      justifyContent: 'center',
                    }}
                    display="flex"
                  >
                    <Group
                      h="100%"
                      justify="center"
                      align="center"
                      style={{ pointerEvents: 'none' }}
                    >
                      <Stack align="center" justify="center" gap={6}>
                        <Dropzone.Accept>
                          <ImagePlus size={30} />
                        </Dropzone.Accept>
                        <Dropzone.Reject>
                          <X size={30} />
                        </Dropzone.Reject>
                        <Dropzone.Idle>
                          <Plus size={28} />
                        </Dropzone.Idle>
                        <Text size="sm">{t('lotForm.images.add')}</Text>
                      </Stack>
                    </Group>
                  </Dropzone>
                )}
              </Group>
            </Stack>
          </Card>

          <Card withBorder radius="md" p="md">
            <Stack>
              <Text fw={700}>{t('lotForm.fields.title')}</Text>
              <TextInput
                maxLength={255}
                label={t('lotForm.fields.generalDescription')}
                placeholder={t('lotForm.fields.generalDescriptionPlaceholder')}
                {...getInputProps('generalDescription')}
              />
              <Textarea
                maxLength={1000}
                label={t('lotForm.fields.characteristics')}
                minRows={6}
                // style={{ height: '10rem' }}
                placeholder={t('lotForm.fields.characteristicsPlaceholder')}
                {...getInputProps('characteristicsDescription')}
              />

              <Group justify="space-between" align="center">
                <NumberInput
                  label={t('lotForm.fields.quantity')}
                  placeholder={t('lotForm.fields.quantityPlaceholder')}
                  min={1}
                  max={10000}
                  allowDecimal={false}
                  {...getInputProps('quantity')}
                />
                {!isArchived ? (
                  <Stack
                    gap="0"
                    justify="space-between"
                    style={{ height: '60px' }}
                  >
                    <Text size="sm" fw={500} style={{ lineHeight: '1.55' }}>
                      {t('admin.filter.status')}
                    </Text>
                    <Group>
                      <SegmentedControl
                        size="md"
                        value={values.visibilityStatus ? 'visible' : 'hidden'}
                        onChange={(value) => {
                          setFieldValue(
                            'visibilityStatus',
                            value === 'visible',
                          );
                        }}
                        data={[
                          {
                            label: (
                              <Group gap={6} wrap="nowrap" align="self-end">
                                <Eye size={16} />
                                <Text size="sm" fw={500}>
                                  {t('lotForm.visibility.visible')}
                                </Text>
                              </Group>
                            ),
                            value: 'visible',
                          },
                          {
                            label: (
                              <Group gap={6} wrap="nowrap" align="self-end">
                                <EyeOff size={16} />
                                <Text size="sm" fw={500}>
                                  {t('lotForm.visibility.hidden')}
                                </Text>
                              </Group>
                            ),
                            value: 'hidden',
                          },
                        ]}
                      />
                      <Tooltip label={t('lotForm.visibility.tooltip')}>
                        <BadgeQuestionMark
                          size={16}
                          style={{ cursor: 'pointer' }}
                        />
                      </Tooltip>
                    </Group>
                  </Stack>
                ) : (
                  <Stack
                    gap="0"
                    justify="space-between"
                    style={{ height: '60px' }}
                  >
                    <Text size="sm" fw={500} style={{ lineHeight: '1.8' }}>
                      {t('lot.visibility.archived')}
                    </Text>
                    <Badge
                      color="gray"
                      size="lg"
                      style={{ alignItems: 'baseline' }}
                    >
                      {values?.archivationDate
                        ? new Date(values.archivationDate).toLocaleDateString()
                        : '—'}
                    </Badge>
                  </Stack>
                )}
              </Group>
            </Stack>
          </Card>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => navigate(-1)}>
              {t('lotForm.actions.cancel')}
            </Button>
            {showDeactivateAction && (
              <Button
                disabled={isFormDirty}
                color="red"
                variant="light"
                loading={loading}
                onClick={() => setStatusActionModal('deactivate')}
              >
                {t('lotForm.actions.deactivate')}
              </Button>
            )}
            {showUnarchiveAction && (
              <Button
                disabled={isFormDirty}
                loading={loading}
                onClick={() => setStatusActionModal('unarchive')}
              >
                {t('lotForm.actions.unarchive')}
              </Button>
            )}
            <Button type="submit" loading={loading} disabled={!isFormDirty}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </form>

      <Modal
        opened={taxonomyOpened}
        onClose={() => {
          setShowContent(false);
          taxonomyControls.close();
        }}
        onEnterTransitionEnd={() => setShowContent(true)}
        onExitTransitionEnd={() => setShowContent(false)}
        title={t('lotForm.modal.selectCategory')}
        size="lg"
      >
        {!showContent ? (
          <SkeletonList />
        ) : (
          <Stack gap="sm">
            {taxonomy.map((chapter) => {
              const ChapterIcon = chapterIcons[chapter.slug] ?? Building2;
              const chapterExpanded = expandedChapters.has(chapter.id);

              return (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  ChapterIcon={ChapterIcon}
                  expanded={chapterExpanded}
                  onToggle={toggleChapter}
                >
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
                            values.categoryId === category.id &&
                            values.chapterId === chapter.id &&
                            values.subcategoryId == null;

                          return (
                            <CategoryItem
                              key={category.id}
                              category={category}
                              expanded={categoryExpanded}
                              selected={categorySelected}
                              hasSubcategories={hasSubcategories}
                              onToggle={() =>
                                toggleCategory(chapter.id, category.id)
                              }
                              onClick={() =>
                                handlePickTaxonomy(chapter.id, category, null)
                              }
                              rightSection={
                                !hasSubcategories && (
                                  <Checkbox
                                    checked={categorySelected}
                                    readOnly
                                  />
                                )
                              }
                            >
                              {hasSubcategories && categoryExpanded && (
                                <Collapse in={categoryExpanded}>
                                  <Stack pl="md" gap={4}>
                                    {category.subcategories.map(
                                      (subcategory) => (
                                        <UnstyledButton
                                          key={subcategory.id}
                                          onClick={() =>
                                            handlePickTaxonomy(
                                              chapter.id,
                                              category,
                                              subcategory.id,
                                            )
                                          }
                                        >
                                          <Group
                                            justify="space-between"
                                            wrap="nowrap"
                                            style={{
                                              borderRadius: 8,
                                              border:
                                                '1px solid var(--mantine-color-gray-2)',
                                              padding: '4px 10px',
                                              backgroundColor:
                                                values.subcategoryId ===
                                                subcategory.id
                                                  ? 'var(--mantine-color-blue-0)'
                                                  : 'var(--mantine-color-white)',
                                            }}
                                          >
                                            <Text size="sm">
                                              {subcategory.name}
                                            </Text>
                                            <Checkbox
                                              checked={
                                                values.subcategoryId ===
                                                subcategory.id
                                              }
                                              readOnly
                                            />
                                          </Group>
                                        </UnstyledButton>
                                      ),
                                    )}
                                  </Stack>
                                </Collapse>
                              )}
                            </CategoryItem>
                          );
                        })}
                      </Stack>
                    )}
                  </Collapse>
                </ChapterItem>
              );
            })}
          </Stack>
        )}
      </Modal>

      <Modal
        opened={geoOpened}
        onClose={geoControls.close}
        title={t('lotForm.geo.modalTitle')}
        centered
      >
        <Stack gap="sm">
          <Select
            label={t('auth.region')}
            placeholder={t('auth.selectRegion')}
            data={regionOptions}
            searchable
            clearable
            value={values.regionId}
            error={errors.regionId}
            onChange={handleRegionChange}
          />

          <Select
            key={`city-${values.regionId || 'empty'}`}
            label={t('auth.city')}
            placeholder={t('auth.selectCity')}
            data={cityOptions}
            searchable
            clearable
            disabled={!values.regionId}
            value={values.cityId}
            error={errors.cityId}
            onChange={handleCityChange}
          />

          <Select
            key={`district-${values.cityId || 'empty'}`}
            label={t('auth.district')}
            placeholder={
              !values.cityId
                ? t('auth.cityNotSelected')
                : districtOptions.length === 0
                  ? t('profile.missed')
                  : t('auth.selectDistrict')
            }
            data={districtOptions}
            searchable
            clearable
            disabled={!values.cityId || districtOptions.length === 0}
            value={values.districtId}
            onChange={(value) => setFieldValue('districtId', value || '')}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={geoControls.close}>
              {t('auth.close')}
            </Button>
            <Button
              onClick={geoControls.close}
              disabled={!values.regionId || !values.cityId}
            >
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={statusActionModal !== null}
        onClose={() => setStatusActionModal(null)}
        title={
          statusActionModal === 'deactivate'
            ? t('lotForm.actions.deactivate')
            : t('lotForm.actions.unarchive')
        }
        centered
      >
        <Stack>
          <Text>
            {statusActionModal === 'deactivate'
              ? t('lotForm.modal.deactivateQuestion')
              : t('lotForm.modal.unarchiveQuestion')}
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setStatusActionModal(null)}
            >
              {t('lotForm.actions.cancel')}
            </Button>
            <Button
              color={statusActionModal === 'deactivate' ? 'red' : undefined}
              loading={loading}
              onClick={handleConfirmStatusAction}
            >
              {t('lotForm.actions.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={unsavedChangesModalOpen}
        onClose={() => {
          setUnsavedChangesModalOpen(false);
          if (unsavedChangesModalOpen && blocker.state === 'blocked') {
            blocker.reset();
          }
        }}
        title={t('lotForm.status.unsaved')}
        centered
      >
        <Stack>
          <Text>{t('lotForm.modal.unsavedWarning')}</Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setUnsavedChangesModalOpen(false);
                if (unsavedChangesModalOpen && blocker.state === 'blocked') {
                  blocker.reset();
                }
              }}
            >
              {t('lotForm.actions.cancel')}
            </Button>
            <Button
              color="red"
              onClick={() => {
                if (blocker.state !== 'blocked') {
                  return;
                }

                blocker.proceed?.();
              }}
            >
              {t('lotForm.actions.continue')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
