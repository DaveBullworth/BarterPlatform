import { createElement, useState } from 'react';
import { ImageUp, ImageOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getCroppedImg, handleApiError, notify } from '@/shared/lib';
import type { Area } from 'react-easy-crop';

type UseAvatarOptions = {
  uploadFn: (file: File) => Promise<{ message: string }>;
  deleteFn: () => Promise<{ message: string }>;
  onUpdated: () => void;
  onClose: () => void;
};

export const useAvatar = ({
  uploadFn,
  deleteFn,
  onUpdated,
  onClose,
}: UseAvatarOptions) => {
  const { t } = useTranslation();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const reset = () => {
    setImageSrc(null);
    setCroppedAreaPixels(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const upload = useMutation({
    mutationFn: async () => {
      if (!imageSrc || !croppedAreaPixels) {
        throw new Error('No image selected');
      }
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      return uploadFn(file);
    },
    onSuccess: () => {
      onUpdated();
      handleClose();
      notify({
        title: t('common.success'),
        icon: createElement(ImageUp),
        message: t('profile.avatarUpdated'),
        color: 'green',
      });
    },
    onError: (error) => handleApiError(error, t),
  });

  const remove = useMutation({
    mutationFn: () => {
      // Локальный превью — просто сбрасываем
      if (imageSrc?.startsWith('blob:')) {
        reset();
        return Promise.resolve({ message: 'ok' });
      }
      return deleteFn();
    },
    onSuccess: () => {
      if (imageSrc?.startsWith('blob:')) return;
      onUpdated();
      handleClose();
      notify({
        title: t('common.success'),
        icon: createElement(ImageOff),
        message: t('profile.avatarDeleted'),
        color: 'green',
      });
    },
    onError: (error) => handleApiError(error, t),
  });

  return {
    imageSrc,
    setImageSrc,
    setCroppedAreaPixels,
    handleClose,
    upload: upload.mutate,
    remove: remove.mutate,
    isUploading: upload.isPending,
    isRemoving: remove.isPending,
    isLoading: upload.isPending || remove.isPending,
  };
};
