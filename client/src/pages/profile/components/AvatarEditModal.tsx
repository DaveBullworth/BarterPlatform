import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Stack, Group, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { Upload, X, ImageUp, ImageOff } from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

import { notify } from '@/shared/utils/notifications';
import { handleApiError } from '@/shared/utils/handleApiError';
import { getCroppedImg } from '@/shared/utils/cropImage';

type Props = {
  opened: boolean;
  onClose: () => void;
  onUpdated: () => void;
  uploadFn: (file: File) => Promise<{ message: string }>;
  deleteFn: () => Promise<{ message: string }>;
};

export const AvatarEditModal = ({
  opened,
  onClose,
  onUpdated,
  uploadFn,
  deleteFn,
}: Props) => {
  const { t } = useTranslation();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Обработчик сохранения аватара
  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setLoading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

      await uploadFn(file);
      onUpdated();
      handleClose();
      // Уведомление об успехе
      notify({
        title: t('common.success'),
        icon: <ImageUp />,
        message: t('profile.avatarUpdated'),
        color: 'green',
        autoClose: 3000,
      });
    } catch (e) {
      handleApiError(e, t);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик удаления аватара
  const handleDelete = async () => {
    if (imageSrc && imageSrc.startsWith('blob:')) {
      // Временный локальный файл — просто сбрасываем preview
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    } else {
      // Серверный аватар — удаляем через API
      setLoading(true);
      try {
        await deleteFn();
        onUpdated();
        handleClose();
        // Уведомление об успехе
        notify({
          title: t('common.success'),
          icon: <ImageOff />,
          message: t('profile.avatarDeleted'),
          color: 'green',
          autoClose: 3000,
        });
      } catch (e) {
        handleApiError(e, t);
      } finally {
        setLoading(false);
      }
    }
  };

  // Обработчик закрытия модалки
  const handleClose = () => {
    // Сбрасываем все локальные состояния Dropzone / Cropper
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

    // Вызываем родительский onClose
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={700} size="lg" td="underline">
          {t('profile.avatar')}
        </Text>
      }
      centered
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <Stack>
        {!imageSrc ? (
          <Dropzone
            accept={['image/png', 'image/jpeg']}
            maxSize={5 * 1024 * 1024}
            onDrop={(files) => setImageSrc(URL.createObjectURL(files[0]))}
          >
            <Group justify="center" gap="xl" style={{ pointerEvents: 'none' }}>
              <Dropzone.Accept>
                <Upload size={52} color="var(--mantine-color-blue-6)" />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <X size={52} color="var(--mantine-color-red-6)" />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <ImageUp size={52} color="var(--mantine-color-dimmed)" />
              </Dropzone.Idle>

              <div>
                <Text size="xl" inline>
                  {t('profile.avatarDrag')}
                </Text>
                <Text size="sm" c="dimmed" inline mt={7}>
                  {t('profile.avatarDragInfo')}
                </Text>
              </div>
            </Group>
          </Dropzone>
        ) : (
          <div style={{ position: 'relative', height: 300 }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        )}

        <Group justify="space-between">
          <Button
            variant="subtle"
            color="red"
            onClick={handleDelete}
            loading={loading}
            disabled={loading}
          >
            {t('common.delete')}
          </Button>

          <Group>
            <Button variant="default" onClick={handleClose} disabled={loading}>
              {t('authRequired.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              loading={loading}
              disabled={!imageSrc || loading}
            >
              {t('common.save')}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
