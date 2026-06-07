import { Stack, Text, Tooltip } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Plus, Star, Trash2, X } from 'lucide-react';

import type { RenderedImage } from '@/features/lot-form';

import styles from '../LotForm.module.scss';

type Props = {
  images: RenderedImage[];
  totalCount: number;
  maxImages: number;
  onAdd: (files: File[]) => void;
  onRemoveExisting: (id: string) => void;
  onRemoveNew: (id: string) => void;
  onSetPrimaryExisting: (id: string) => void;
  onSetPrimaryNew: (id: string) => void;
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
}: Props) => {
  const { t } = useTranslation();
  const canAddMore = totalCount < maxImages;

  return (
    <div className={styles.imagesGrid}>
      {images.map((image) => {
        const cardClass = [
          styles.imageCard,
          image.isPrimary ? styles.imageCardPrimary : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={image.key} className={cardClass}>
            <img src={image.src} alt="lot" loading="lazy" />
            <div className={styles.imageOverlay}>
              <div className={styles.imageTopRow}>
                {image.isPrimary ? (
                  <span className={styles.primaryBadge}>
                    <Star size={11} fill="currentColor" />
                    {t('lotForm.images.primary')}
                  </span>
                ) : (
                  <Tooltip label={t('lotForm.images.setPrimary')} withArrow>
                    <button
                      type="button"
                      className={styles.primaryStarBtn}
                      onClick={() =>
                        image.kind === 'existing'
                          ? onSetPrimaryExisting(image.imageId)
                          : onSetPrimaryNew(image.imageId)
                      }
                      aria-label={t('lotForm.images.setPrimary')}
                    >
                      <Star size={11} />
                    </button>
                  </Tooltip>
                )}
                <Tooltip label={t('common.delete')} withArrow>
                  <button
                    type="button"
                    className={styles.imageDeleteBtn}
                    onClick={() =>
                      image.kind === 'existing'
                        ? onRemoveExisting(image.imageId)
                        : onRemoveNew(image.imageId)
                    }
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        );
      })}

      {canAddMore && (
        <Dropzone
          accept={['image/*']}
          maxSize={8 * 1024 * 1024}
          onDrop={onAdd}
          className={styles.dropzone}
        >
          <div className={styles.dropzoneInner}>
            <Dropzone.Accept>
              <ImagePlus size={26} />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <X size={26} />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <Plus size={26} />
            </Dropzone.Idle>
            <Stack gap={0} align="center">
              <Text size="xs" fw={600}>
                {t('lotForm.images.add')}
              </Text>
              <Text size="xs" c="dimmed">
                {totalCount}/{maxImages}
              </Text>
            </Stack>
          </div>
        </Dropzone>
      )}
    </div>
  );
};
