import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  ActionIcon,
  Box,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import type { TFunction } from 'i18next';
import { Trash2, ImagePlus, X, Plus } from 'lucide-react';

type ImageItem = {
  key: string;
  imageId: string;
  isPrimary: boolean;
  src: string;
  kind: 'existing' | 'new';
};

export type ImagesSectionProps = {
  images: ImageItem[];
  totalCount: number;
  maxImages: number;
  onAdd: (files: File[]) => void;
  onRemoveExisting: (id: string) => void;
  onRemoveNew: (id: string) => void;
  onSetPrimaryExisting: (id: string) => void;
  onSetPrimaryNew: (id: string) => void;
  t: TFunction;
};

export const ImagesSection = ({
  images,
  totalCount,
  maxImages,
  onAdd,
  onRemoveExisting,
  onRemoveNew,
  onSetPrimaryExisting,
  onSetPrimaryNew,
  t,
}: ImagesSectionProps) => {
  return (
    <Card withBorder radius="md" p="md">
      <Stack>
        <Group justify="space-between">
          <Text fw={700}>{t('lotForm.images.title')}</Text>
          <Text size="sm" c="dimmed">
            {totalCount}/{maxImages}
          </Text>
        </Group>

        <Group>
          {images.map((image) => (
            <Card key={image.key} withBorder p="xs" w={180}>
              <Stack gap="xs">
                <Box h={120} style={{ overflow: 'hidden', borderRadius: 8 }}>
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
                    <Badge color="yellow">{t('lotForm.images.primary')}</Badge>
                  ) : (
                    <Button
                      variant="subtle"
                      size="compact-xs"
                      onClick={() =>
                        image.kind === 'existing'
                          ? onSetPrimaryExisting(image.imageId)
                          : onSetPrimaryNew(image.imageId)
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
                        ? onRemoveExisting(image.imageId)
                        : onRemoveNew(image.imageId)
                    }
                  >
                    <Trash2 size={14} />
                  </ActionIcon>
                </Group>
              </Stack>
            </Card>
          ))}

          {totalCount < maxImages && (
            <Dropzone
              accept={['image/png', 'image/jpeg']}
              maxSize={8 * 1024 * 1024}
              onDrop={onAdd}
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
  );
};
