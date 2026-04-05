import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Center,
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
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import {
  BadgeQuestionMark,
  Check,
  ChevronRight,
  ImagePlus,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  const allowNavigationRef = useRef(false);

  const form = useForm<FormValues>({
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

  const blocker = useBlocker(!allowNavigationRef.current && form.isDirty());

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return;
    }

    setUnsavedChangesModalOpen(true);
  }, [blocker.state]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!form.isDirty()) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      newImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [form, newImages]);

  useEffect(() => {
    dispatch(fetchTaxonomyIfNeeded());
  }, [dispatch]);

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

        form.setValues({
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
        form.resetDirty();

        setExistingImages(images.images);
      } catch (error) {
        handleApiError(error, t);
        navigate(-1);
      } finally {
        setInitializing(false);
      }
    };

    void load();
  }, [form, id, navigate, resolveTaxonomyPath, t]);

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

    form.setValues({
      chapterId,
      categoryId: category.id,
      subcategoryId,
      taxonomyPath: path,
    });

    form.setDirty({
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
    form.setDirty({});
  };

  const setExistingImagePrimary = (imageId: string) => {
    setExistingImages((prev) =>
      prev.map((image) => ({ ...image, isPrimary: image.imageId === imageId })),
    );

    setPendingPrimaryImageId(imageId);
    form.setDirty({});
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
    form.setDirty({});
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages((prev) =>
      prev.filter((item) => item.imageId !== imageId),
    );
    setPendingDeleteImageIds((prev) => [...prev, imageId]);
    if (pendingPrimaryImageId === imageId) {
      setPendingPrimaryImageId(null);
    }
    form.setDirty({});
  };

  const removeNewImage = (imageId: string) => {
    setNewImages((prev) => {
      const target = prev.find((item) => item.id === imageId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== imageId);
    });
    form.setDirty({});
  };

  const onSubmit = form.onSubmit(async (values) => {
    if (!values.chapterId || !values.categoryId) {
      form.setFieldError(
        'taxonomyPath',
        t('lotForm.validation.taxonomyRequired'),
      );
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

      form.resetDirty();

      // Разрешаем навигацию
      allowNavigationRef.current = true;

      // TODO: заменить на страницу лота после её реализации
      goToRoot(navigate);
    } catch (error) {
      handleApiError(error, t);
    } finally {
      setLoading(false);
    }
  });

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
        <Badge color={form.isDirty() ? 'yellow' : 'green'}>
          {form.isDirty()
            ? t('lotForm.status.unsaved')
            : t('lotForm.status.saved')}
        </Badge>
      </Group>

      <form onSubmit={onSubmit}>
        <Stack>
          <Card withBorder radius="md" p="md">
            <Stack>
              <Text fw={700}>{t('lotForm.taxonomy.title')}</Text>
              <TextInput
                label={t('lotForm.taxonomy.selected')}
                placeholder={t('lotForm.taxonomy.placeholder')}
                readOnly
                value={form.values.taxonomyPath}
                error={form.errors.taxonomyPath}
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
                {...form.getInputProps('generalDescription')}
              />
              <Textarea
                label={t('lotForm.fields.characteristics')}
                minRows={6}
                placeholder={t('lotForm.fields.characteristicsPlaceholder')}
                {...form.getInputProps('characteristicsDescription')}
              />
              <NumberInput
                label={t('lotForm.fields.quantity')}
                placeholder={t('lotForm.fields.quantityPlaceholder')}
                min={1}
                allowDecimal={false}
                {...form.getInputProps('quantity')}
              />
              <Group gap="xs" align="center">
                <Tooltip label={t('lotForm.visibility.tooltip')}>
                  <BadgeQuestionMark size={16} style={{ cursor: 'pointer' }} />
                </Tooltip>
                <Switch
                  label={
                    form.values.visibilityStatus
                      ? t('lotForm.visibility.visible')
                      : t('lotForm.visibility.hidden')
                  }
                  checked={form.values.visibilityStatus}
                  onChange={(event) => {
                    form.setFieldValue(
                      'visibilityStatus',
                      event.currentTarget.checked,
                    );
                    form.setDirty({ visibilityStatus: true });
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
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : (
          <Stack gap="sm">
            {taxonomy.map((chapter) => {
              const chapterExpanded = expandedChapters.has(chapter.id);
              return (
                <Stack key={chapter.id} gap={4}>
                  <UnstyledButton
                    onClick={() => {
                      setExpandedChapters((prev) => {
                        const next = new Set(prev);
                        if (next.has(chapter.id)) {
                          next.delete(chapter.id);
                        } else {
                          next.add(chapter.id);
                        }
                        return next;
                      });
                    }}
                  >
                    <Group
                      justify="space-between"
                      style={{
                        border: '1px solid #eee',
                        borderRadius: 8,
                        padding: 8,
                      }}
                    >
                      <Group gap={8}>
                        <ThemeIcon variant="light" size="sm">
                          <Star size={14} />
                        </ThemeIcon>
                        <Text fw={600}>{chapter.name}</Text>
                      </Group>
                      <ChevronRight
                        size={16}
                        style={{
                          transform: chapterExpanded
                            ? 'rotate(90deg)'
                            : 'rotate(0deg)',
                          transition: 'transform 150ms ease',
                        }}
                      />
                    </Group>
                  </UnstyledButton>

                  <Collapse in={chapterExpanded}>
                    <Stack pl="md" gap={4}>
                      {chapter.categories.map((category) => {
                        const hasSubcategories =
                          category.subcategories.length > 0;
                        const categoryKey = getCategoryKey(
                          chapter.id,
                          category.id,
                        );
                        const categoryExpanded =
                          expandedCategories.has(categoryKey);

                        return (
                          <Stack key={category.id} gap={4}>
                            <UnstyledButton
                              onClick={() => {
                                if (hasSubcategories) {
                                  setExpandedCategories((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(categoryKey))
                                      next.delete(categoryKey);
                                    else next.add(categoryKey);
                                    return next;
                                  });
                                  return;
                                }

                                handlePickTaxonomy(chapter.id, category, null);
                              }}
                            >
                              <Group
                                justify="space-between"
                                style={{
                                  border: '1px solid #f0f0f0',
                                  borderRadius: 8,
                                  padding: 8,
                                }}
                              >
                                <Text>{category.name}</Text>
                                {hasSubcategories ? (
                                  <ChevronRight
                                    size={16}
                                    style={{
                                      transform: categoryExpanded
                                        ? 'rotate(90deg)'
                                        : 'rotate(0deg)',
                                      transition: 'transform 150ms ease',
                                    }}
                                  />
                                ) : (
                                  <Checkbox
                                    checked={
                                      form.values.categoryId === category.id &&
                                      form.values.chapterId === chapter.id &&
                                      form.values.subcategoryId == null
                                    }
                                    readOnly
                                  />
                                )}
                              </Group>
                            </UnstyledButton>

                            {hasSubcategories && (
                              <Collapse in={categoryExpanded}>
                                <Stack pl="md" gap={4}>
                                  {category.subcategories.map((subcategory) => (
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
                                        style={{
                                          border: '1px solid #f5f5f5',
                                          borderRadius: 8,
                                          padding: 8,
                                        }}
                                      >
                                        <Text>{subcategory.name}</Text>
                                        <Checkbox
                                          checked={
                                            form.values.subcategoryId ===
                                            subcategory.id
                                          }
                                          readOnly
                                        />
                                      </Group>
                                    </UnstyledButton>
                                  ))}
                                </Stack>
                              </Collapse>
                            )}
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Collapse>
                </Stack>
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

                allowNavigationRef.current = true;
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
