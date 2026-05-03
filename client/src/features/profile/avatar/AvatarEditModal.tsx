import Cropper from 'react-easy-crop';
import { useState, useCallback } from 'react';
import { Modal, Button, Stack, Group, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { Upload, X, ImageUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Area } from 'react-easy-crop';

import { notify } from '@/shared/lib/notify';
import { useAvatar } from './useAvatar';

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
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const {
    imageSrc,
    setImageSrc,
    setCroppedAreaPixels,
    handleClose,
    upload,
    remove,
    isLoading,
  } = useAvatar({ uploadFn, deleteFn, onUpdated, onClose });

  const onCropComplete = useCallback(
    (_: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
    },
    [setCroppedAreaPixels],
  );

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
            onDrop={(files) => {
              setImageSrc(URL.createObjectURL(files[0]));
            }}
            onReject={(files) => {
              if (files.some((f) => f.file.size > 5 * 1024 * 1024)) {
                notify({
                  title: t('profile.avatarError'),
                  message: t('profile.sizeLimit', { size: 5 }),
                  color: 'yellow',
                  position: 'top-center',
                });
              }
            }}
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
              <Stack gap={4}>
                <Text size="xl" inline>
                  {t('profile.avatarDrag')}
                </Text>
                <Text size="sm" c="dimmed" inline>
                  {t('profile.avatarDragInfo')}
                </Text>
              </Stack>
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
            onClick={() => remove()}
            loading={isLoading}
          >
            {t('common.delete')}
          </Button>

          <Group>
            <Button
              variant="default"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('authRequired.cancel')}
            </Button>
            <Button
              onClick={() => upload()}
              loading={isLoading}
              disabled={!imageSrc}
            >
              {t('common.save')}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
