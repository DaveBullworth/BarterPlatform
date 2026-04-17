import { useCallback, useMemo, useState } from 'react';

const MAX_IMAGES = 3;

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

export const useLotImages = () => {
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [pendingDeleteImageIds, setPendingDeleteImageIds] = useState<string[]>(
    [],
  );
  const [pendingPrimaryImageId, setPendingPrimaryImageId] = useState<
    string | null
  >(null);

  const [initialImagesState, setInitialImagesState] = useState<{
    primaryImageId: string | null;
    existingIds: string[];
  } | null>(null);

  // --- derived

  const totalImagesCount = existingImages.length + newImages.length;

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

    return (
      isPrimaryChanged ||
      isExistingChanged ||
      newImages.length > 0 ||
      pendingDeleteImageIds.length > 0
    );
  };

  // --- handlers

  const handleAddImage = (files: File[]) => {
    const freeSlots = MAX_IMAGES - totalImagesCount;
    if (freeSlots <= 0) return;

    const hasPrimary =
      existingImages.some((i) => i.isPrimary) ||
      newImages.some((i) => i.isPrimary);

    const next = files.slice(0, freeSlots).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: false,
    }));

    if (!hasPrimary && next.length > 0) {
      next[0].isPrimary = true;
    }

    setNewImages((prev) => [...prev, ...next]);
  };

  const setExistingImagePrimary = (imageId: string) => {
    setExistingImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.imageId === imageId,
      })),
    );

    setNewImages((prev) => prev.map((img) => ({ ...img, isPrimary: false })));

    setPendingPrimaryImageId(imageId);
  };

  const setNewImagePrimary = (id: string) => {
    setNewImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      })),
    );

    setExistingImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: false })),
    );

    setPendingPrimaryImageId(null);
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.imageId !== imageId));

    setPendingDeleteImageIds((prev) => [...prev, imageId]);

    setPendingPrimaryImageId((prev) => (prev === imageId ? null : prev));
  };

  const removeNewImage = (id: string) => {
    setNewImages((prev) => {
      const target = prev.find((i) => i.id === id);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      const filtered = prev.filter((i) => i.id !== id);

      if (
        target?.isPrimary &&
        filtered.length > 0 &&
        !filtered.some((i) => i.isPrimary)
      ) {
        return filtered.map((i, idx) => ({
          ...i,
          isPrimary: idx === 0,
        }));
      }

      return filtered;
    });
  };

  // --- helpers for outside (важно!)

  const setInitialImages = useCallback((images: ExistingImage[]) => {
    setExistingImages(images);

    setInitialImagesState({
      primaryImageId: images.find((img) => img.isPrimary)?.imageId ?? null,
      existingIds: images.map((img) => img.imageId),
    });
  }, []);

  const resetImages = () => {
    setNewImages([]);
    setInitialImagesState(null);
  };

  return {
    // state
    newImages,
    pendingDeleteImageIds,
    pendingPrimaryImageId,

    // derived
    totalImagesCount,
    renderedImages,
    computeImagesDirty,

    // actions
    handleAddImage,
    setExistingImagePrimary,
    setNewImagePrimary,
    removeExistingImage,
    removeNewImage,

    // external control
    setInitialImages,
    resetImages,
  };
};
