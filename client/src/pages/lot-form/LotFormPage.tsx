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
  Stack,
  Switch,
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
import type { TaxonomyCategory } from '@/types/taxonomy';
import { createLot, getLotById, updateLot } from '@/http/lots';
import {
  deleteLotImage,
  getLotImages,
  setPrimaryLotImage,
  uploadLotImage,
} from '@/http/media';
import { LOT_VISIBILITY_STATUS, type CreateLotDto } from '@/types/lot';
import { notify } from '@/shared/utils/notifications';
import { handleApiError } from '@/shared/utils/handleApiError';
import { goToRoot } from '@/shared/utils/navigation';
import { chapterIcons } from '@/shared/utils/chapterIcons';
import { ChapterItem } from '@/app/layout/categoriesDrawer/ChapterItem';
import { CategoryItem } from '@/app/layout/categoriesDrawer/CategoryItem';
import { SkeletonList } from '@/app/layout/categoriesDrawer/ChapterItemSkeleton';

type FormValues = {
  taxonomyPath: string;
  chapterId: number | null;
  categoryId: number | null;
  subcategoryId: number | null;
  generalDescription: string;
  characteristicsDescription: string;
  quantity: number;
  visibilityStatus: boolean;
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
};

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

  const [taxonomyOpened, taxonomyControls] = useDisclosure(false);
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
  const [shouldNavigate, setShouldNavigate] = useState(false);

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
    },
  });

  const blocker = useBlocker(isDirty());

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
    if (taxonomyOpened) {
      initExpandedFromForm();
    }
  }, [taxonomyOpened, initExpandedFromForm]);

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
          visibilityStatus:
            lot.visibilityStatus === LOT_VISIBILITY_STATUS.ACTIVE,
        });
        resetDirty();

        setExistingImages(images.images);
      } catch (error) {
        handleApiError(error, t);
        navigate(-1);
      } finally {
        setInitializing(false);
      }
    };

    void load();
  }, [id, navigate, resolveTaxonomyPath, setValues, resetDirty, t]);

  useEffect(() => {
    if (!shouldNavigate) return;

    // TODO: заменить на страницу лота после её реализации
    goToRoot(navigate);
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

    setDirty({
      chapterId: true,
      categoryId: true,
      subcategoryId: true,
      taxonomyPath: true,
    });

    setShowContent(false);
    taxonomyControls.close();
  };

  const handleAddImage = (files: File[]) => {
    const freeSlots = MAX_IMAGES - totalImagesCount;

    if (freeSlots <= 0) return;

    const nextImages = files.slice(0, freeSlots).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewImages((prev) => [...prev, ...nextImages]);
    setDirty({});
  };

  const setExistingImagePrimary = (imageId: string) => {
    setExistingImages((prev) =>
      prev.map((image) => ({ ...image, isPrimary: image.imageId === imageId })),
    );

    setPendingPrimaryImageId(imageId);
    setDirty({});
  };

  const setNewImagePrimary = (id: string) => {
    setNewImages((prev) => {
      const current = prev.find((item) => item.id === id);
      if (!current) return prev;
      return [current, ...prev.filter((item) => item.id !== id)];
    });

    setExistingImages((prev) =>
      prev.map((image) => ({ ...image, isPrimary: false })),
    );
    setPendingPrimaryImageId(null);
    setDirty({});
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages((prev) =>
      prev.filter((item) => item.imageId !== imageId),
    );
    setPendingDeleteImageIds((prev) => [...prev, imageId]);
    if (pendingPrimaryImageId === imageId) {
      setPendingPrimaryImageId(null);
    }
    setDirty({});
  };

  const removeNewImage = (imageId: string) => {
    setNewImages((prev) => {
      const target = prev.find((item) => item.id === imageId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== imageId);
    });
    setDirty({});
  };

  const onSubmitForm = onSubmit(async (values) => {
    if (!values.chapterId || !values.categoryId) {
      setFieldError('taxonomyPath', t('lotForm.validation.taxonomyRequired'));
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

      for (const image of newImages) {
        await uploadLotImage(lotId, image.file);
      }

      if (pendingPrimaryImageId) {
        await setPrimaryLotImage(lotId, pendingPrimaryImageId);
      }

      notify({
        title: t('common.success'),
        message: isEditMode
          ? t('lotForm.success.updated')
          : t('lotForm.success.created'),
        color: 'green',
        icon: <Check size={16} />,
      });

      resetDirty();

      setShouldNavigate(true);
    } catch (error) {
      handleApiError(error, t);
    } finally {
      setLoading(false);
    }
  });

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

    const fresh = newImages.map((image, index) => ({
      key: image.id,
      imageId: image.id,
      isPrimary: existing.length === 0 && index === 0,
      src: image.previewUrl,
      kind: 'new' as const,
    }));

    return [...existing, ...fresh];
  }, [existingImages, newImages]);

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
        <Badge color={isDirty() ? 'yellow' : 'green'}>
          {isDirty() ? t('lotForm.status.unsaved') : t('lotForm.status.saved')}
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
                label={t('lotForm.fields.generalDescription')}
                placeholder={t('lotForm.fields.generalDescriptionPlaceholder')}
                {...getInputProps('generalDescription')}
              />
              <Textarea
                label={t('lotForm.fields.characteristics')}
                minRows={6}
                placeholder={t('lotForm.fields.characteristicsPlaceholder')}
                {...getInputProps('characteristicsDescription')}
              />
              <NumberInput
                label={t('lotForm.fields.quantity')}
                placeholder={t('lotForm.fields.quantityPlaceholder')}
                min={1}
                allowDecimal={false}
                {...getInputProps('quantity')}
              />
              <Group gap="xs" align="center">
                <Tooltip label={t('lotForm.visibility.tooltip')}>
                  <BadgeQuestionMark size={16} style={{ cursor: 'pointer' }} />
                </Tooltip>
                <Switch
                  label={
                    values.visibilityStatus
                      ? t('lotForm.visibility.visible')
                      : t('lotForm.visibility.hidden')
                  }
                  checked={values.visibilityStatus}
                  onChange={(event) => {
                    setFieldValue(
                      'visibilityStatus',
                      event.currentTarget.checked,
                    );
                    setDirty({ visibilityStatus: true });
                  }}
                />
              </Group>
            </Stack>
          </Card>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => navigate(-1)}>
              {t('lotForm.actions.cancel')}
            </Button>
            <Button type="submit" loading={loading}>
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
