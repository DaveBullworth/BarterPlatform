import { useState, useMemo } from 'react';
import { MAX_LOT_IMAGES } from './model';
import { toLotImageSrc, type LotImage } from '@/entities/lot';

export type NewImage = {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
};

export type RenderedImage = {
  key: string;
  imageId: string;
  isPrimary: boolean;
  src: string;
  kind: 'existing' | 'new';
};

export const useLotImages = (serverImages: LotImage[] = []) => {
  const [existingImages, setExistingImages] =
    useState<LotImage[]>(serverImages);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [pendingPrimaryId, setPendingPrimaryId] = useState<string | null>(null);

  // Синхронизация при загрузке данных (edit mode)
  // Вызывается один раз когда serverImages загрузились
  const initFromServer = (images: LotImage[]) => {
    setExistingImages(images);
    setDeletedIds([]);
    setNewImages([]);
    setPendingPrimaryId(null);
  };

  const totalCount = existingImages.length + newImages.length;

  const rendered: RenderedImage[] = useMemo(() => {
    const existing = existingImages.map((img) => ({
      key: img.imageId,
      imageId: img.imageId,
      isPrimary: img.isPrimary,
      src: toLotImageSrc(img)!,
      kind: 'existing' as const,
    }));

    const fresh = newImages.map((img) => ({
      key: img.id,
      imageId: img.id,
      isPrimary: img.isPrimary,
      src: img.previewUrl,
      kind: 'new' as const,
    }));

    return [...existing, ...fresh];
  }, [existingImages, newImages]);

  const isDirty =
    deletedIds.length > 0 || newImages.length > 0 || pendingPrimaryId !== null;

  // Добавление новых изображений
  const addImages = (files: File[]) => {
    const freeSlots = MAX_LOT_IMAGES - totalCount;
    if (freeSlots <= 0) return;

    const hasPrimary =
      existingImages.some((i) => i.isPrimary) ||
      newImages.some((i) => i.isPrimary);

    const added = files.slice(0, freeSlots).map((file, index) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: !hasPrimary && index === 0,
    }));

    setNewImages((prev) => [...prev, ...added]);
  };

  // Установить главное — existing
  const setPrimaryExisting = (imageId: string) => {
    setExistingImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.imageId === imageId })),
    );
    setNewImages((prev) => prev.map((img) => ({ ...img, isPrimary: false })));
    setPendingPrimaryId(imageId);
  };

  // Установить главное — new
  const setPrimaryNew = (id: string) => {
    setNewImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.id === id })),
    );
    setExistingImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: false })),
    );
    setPendingPrimaryId(null);
  };

  // Удалить existing
  const removeExisting = (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.imageId !== imageId));
    setDeletedIds((prev) => [...prev, imageId]);
    if (pendingPrimaryId === imageId) setPendingPrimaryId(null);
  };

  // Удалить new
  const removeNew = (id: string) => {
    setNewImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);

      const filtered = prev.filter((i) => i.id !== id);

      // Если удалили primary — назначаем первый оставшийся
      if (target?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }

      return filtered;
    });
  };

  const reset = () => {
    newImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setNewImages([]);
    setDeletedIds([]);
    setPendingPrimaryId(null);
  };

  return {
    existingImages,
    newImages,
    deletedIds,
    pendingPrimaryId,
    totalCount,
    rendered,
    isDirty,
    addImages,
    setPrimaryExisting,
    setPrimaryNew,
    removeExisting,
    removeNew,
    initFromServer,
    reset,
  };
};
